(() => {
	const supabase = window.ejireSupabase;
	const allowlistedAdminEmail = "dosusamson27@gmail.com";
	const app = document.querySelector("#admin-app");
	const gate = document.querySelector("#admin-gate");
	const status = document.querySelector("#dashboard-status");
	let currentUser = null;
	let currentProfile = null;
	const pageSize = 20;
	let studentPage = 0;
	let studentRequest = 0;
	let studentSearchTimer = 0;
	let visibleStudents = [];
	let visibleInstructors = [];
	let globalSearchResults = [];
	let accessRevoked = false;

	function showStatus(message) {
		if (status) status.textContent = message || "";
	}

	function displayDate(value) {
		if (!value) return "Not provided";
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
	}

	function textCell(value) {
		if (value === null || value === undefined || value === "") return "Not provided";
		if (Array.isArray(value)) return value.join(", ");
		if (typeof value === "object") return JSON.stringify(value);
		return String(value);
	}

	function setRows(element, rows, columns, emptyMessage) {
		element.replaceChildren();
		if (!rows.length) {
			const tr = document.createElement("tr");
			const td = document.createElement("td");
			td.colSpan = columns;
			td.className = "table-empty";
			td.textContent = emptyMessage;
			tr.append(td);
			element.append(tr);
			return;
		}
		for (const values of rows) {
			const tr = document.createElement("tr");
			for (const value of values) {
				const td = document.createElement("td");
				td.textContent = textCell(value);
				tr.append(td);
			}
			element.append(tr);
		}
	}

	function setMetric(selector, value, state = "ready") {
		const metric = document.querySelector(selector);
		if (!metric) return;
		metric.textContent = value;
		metric.dataset.metric = state;
	}

	function addDetailButton(row, label, index, entity) {
		const cell = document.createElement("td");
		const button = document.createElement("button");
		button.type = "button";
		button.className = "table-action";
		button.textContent = label;
		button.dataset.detailEntity = entity;
		button.dataset.detailIndex = String(index);
		cell.append(button);
		row.append(cell);
	}

	function firstValue(row, keys) {
		for (const key of keys) {
			if (row[key] !== null && row[key] !== undefined && row[key] !== "") return row[key];
		}
		return "Not provided";
	}

	async function getCurrentProfile(userId) {
		const { data, error } = await supabase
			.from("profiles")
			.select("id, full_name, role, created_at")
			.eq("id", userId)
			.maybeSingle();
		if (error) throw error;
		return data;
	}

	function roleDestination(role, email) {
		if (role === "student") {
			return "../auth/student-dashboard.html";
		}
		if (role === "instructor") {
			return "../auth/portal.html?role=instructor";
		}
		if (role === "admin" && email?.toLowerCase() !== allowlistedAdminEmail) {
			return "../index.html";
		}
		return "../auth/login.html";
	}

	// Client-side role checks only gate the UI; Supabase RLS must authorize every data request.
	async function requireAdmin() {
		try {
			if (!supabase) throw new Error("Supabase client is not configured.");
			const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
			if (sessionError) throw sessionError;
			if (!sessionData.session) {
				window.location.replace("../auth/login.html");
				return;
			}
			const { data: userData, error: userError } = await supabase.auth.getUser();
			if (userError || !userData.user) {
				window.location.replace("../auth/login.html");
				return;
			}
			currentUser = userData.user;
			const isAllowlistedAdmin = currentUser.email?.toLowerCase() === allowlistedAdminEmail && Boolean(currentUser.email_confirmed_at);
			if (!isAllowlistedAdmin) {
				gate.textContent = "This account is not authorized for the admin dashboard. Redirecting...";
				window.setTimeout(() => window.location.replace(roleDestination(currentProfile?.role, currentUser.email)), 900);
				return;
			}
			try {
				currentProfile = await getCurrentProfile(currentUser.id);
			} catch (error) {
				console.error("Could not load the administrator profile.", error);
				currentProfile = null;
			}
			gate.hidden = true;
			app.hidden = false;
			const adminName = currentProfile?.full_name || currentUser.email || "Administrator";
			document.querySelector("#admin-identity").textContent = adminName;
			document.querySelector("#admin-avatar").textContent = adminName
				.split(/\s+/)
				.filter(Boolean)
				.slice(0, 2)
				.map((part) => part[0].toUpperCase())
				.join("");
			document.querySelector("#settings-name").textContent = currentProfile?.full_name || "Not provided";
			document.querySelector("#settings-email").textContent = currentUser.email || "Not available";
			document.querySelector("#current-date").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
			subscribeToAuthChanges();
			await loadOverview();
			const initialView = window.location.hash.slice(1);
			if (initialView && document.querySelector(`[data-section="${initialView}"]`)) await openView(initialView);
		} catch (error) {
			gate.textContent = error.message?.toLowerCase().includes("supabase")
				? "Admin dashboard is unavailable. Add the existing Supabase project URL and anon key to supabase-client.js."
				: "Could not verify admin access. Check your connection and database profile permissions, then try again.";
		}
	}

	async function loadCount(table, role) {
		if (accessRevoked) throw new Error("Admin session is no longer active.");
		let query = supabase.from(table).select("id", { count: "exact", head: true });
		if (role) query = query.eq("role", role);
		const { count, error } = await query;
		if (error) throw error;
		return count ?? 0;
	}

	async function loadOverview() {
		if (accessRevoked) return;
		const requests = [
			["#total-students", () => loadCount("profiles", "student")],
			["#total-instructors", () => loadCount("profiles", "instructor")]
		];
		const results = await Promise.allSettled(requests.map(([, request]) => request()));
		if (accessRevoked) return;
		results.forEach((result, index) => {
			setMetric(requests[index][0], result.status === "fulfilled" ? result.value.toLocaleString() : "Unavailable", result.status);
			if (result.status === "rejected") console.error(`Admin dashboard metric unavailable: ${requests[index][0]}.`, result.reason);
		});
		if (results.some((result) => result.status === "rejected")) {
			showStatus("Some totals are unavailable. Confirm the related tables and administrator read policies in Supabase.");
		}
		await loadRecentProfiles();
	}

	async function loadRecentProfiles() {
		if (accessRevoked) return;
		const body = document.querySelector("#recent-profiles");
		try {
			const { data, error } = await supabase.from("profiles").select("full_name, role, created_at").order("created_at", { ascending: false }).limit(5);
			if (accessRevoked) return;
			if (error) throw error;
			setRows(body, (data || []).map((row) => [
				firstValue(row, ["full_name"]),
				firstValue(row, ["role"]),
				displayDate(row.created_at)
			]), 3, "No recent profile activity.");
		} catch (error) {
			console.error("Could not load recent admin activity.", error);
			setRows(body, [], 3, "Recent profiles are unavailable under current permissions.");
		}
	}

	async function loadStudents() {
		if (accessRevoked) return;
		const requestId = ++studentRequest;
		const body = document.querySelector("#students-table");
		const search = document.querySelector("#student-search").value.trim();
		const sortBy = document.querySelector("#student-sort").value;
		body.innerHTML = '<tr><td colspan="7" class="table-empty">Loading student profiles...</td></tr>';
		try {
			let query = supabase.from("profiles").select("id, full_name, role, created_at", { count: "exact" })
				.eq("role", "student")
				.order(sortBy, { ascending: sortBy === "full_name" })
				.range(studentPage * pageSize, (studentPage + 1) * pageSize - 1);
			if (search) query = query.ilike("full_name", `%${search.replace(/[%_,]/g, "")}%`);
			const { data, error, count } = await query;
			if (accessRevoked || requestId !== studentRequest) return;
			if (error) throw error;
			visibleStudents = data || [];
			const rows = visibleStudents.map((profile, index) => {
				const tr = document.createElement("tr");
				const values = [
					profile.full_name || "Not provided",
					"Not available",
					"Not available",
					"Not tracked",
					displayDate(profile.created_at),
					"Not tracked"
				];
				values.forEach((value) => {
					const td = document.createElement("td");
					td.textContent = textCell(value);
					tr.append(td);
				});
				addDetailButton(tr, "View details", index, "profile");
				return tr;
			});
			body.replaceChildren(...rows);
			if (!rows.length) setRows(body, [], 7, search ? "No student profiles match this search." : "No student profiles found.");
			document.querySelector("#students-count").textContent = count === null ? `${visibleStudents.length} shown` : `${count.toLocaleString()} students`;
			document.querySelector("#students-page").textContent = `Page ${studentPage + 1}`;
			document.querySelector("#students-previous").disabled = studentPage === 0;
			document.querySelector("#students-next").disabled = count === null || (studentPage + 1) * pageSize >= count;
		} catch (error) {
			console.error("Could not load student profiles.", error);
			if (accessRevoked || requestId !== studentRequest) return;
			setRows(body, [], 7, "Student profiles are unavailable under current permissions.");
			showStatus("Could not load student profiles. Check the profiles table and administrator read policy.");
		}
	}

	async function loadInstructors() {
		if (accessRevoked) return;
		const body = document.querySelector("#instructors-table");
		body.innerHTML = '<tr><td colspan="7" class="table-empty">Loading instructor profiles...</td></tr>';
		try {
			const { data, error } = await supabase.from("profiles").select("id, full_name, role, created_at").eq("role", "instructor").order("created_at", { ascending: false }).limit(100);
			if (accessRevoked) return;
			if (error) throw error;
			visibleInstructors = data || [];
			const rows = visibleInstructors.map((profile, index) => {
				const tr = document.createElement("tr");
				[profile.full_name || "Not provided", "Not available", "Not tracked", "Not tracked", "Not tracked", displayDate(profile.created_at)]
					.forEach((value) => {
						const td = document.createElement("td");
						td.textContent = textCell(value);
						tr.append(td);
					});
				addDetailButton(tr, "View details", index, "profile");
				return tr;
			});
			body.replaceChildren(...rows);
			if (!rows.length) setRows(body, [], 7, "No instructor profiles found.");
		} catch (error) {
			console.error("Could not load instructor profiles.", error);
			if (accessRevoked) return;
			setRows(body, [], 7, "Instructor profiles are unavailable under current permissions.");
			showStatus("Could not load instructor profiles. Check the profiles table and administrator read policy.");
		}
	}

	async function openView(name) {
		if (accessRevoked) return;
		document.querySelectorAll("[data-section]").forEach((section) => { section.hidden = section.dataset.section !== name; });
		document.querySelectorAll(".admin-nav [data-view]").forEach((link) => link.classList.toggle("is-active", link.dataset.view === name));
		document.querySelector("#admin-sidebar").classList.remove("is-open");
		document.querySelector("#sidebar-toggle").setAttribute("aria-expanded", "false");
		history.replaceState(null, "", `#${name}`);
		showStatus("");
		if (name === "students") await loadStudents();
		if (name === "instructors") await loadInstructors();
		if (name === "reports") await loadReports();
	}

	async function logout() {
		const buttons = document.querySelectorAll("[data-logout], #logout-button, #topbar-logout");
		buttons.forEach((button) => { button.disabled = true; });
		try {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;
			revokeAccess("../auth/login.html");
		} catch (error) {
			console.error("Admin sign-out failed.", error);
			showStatus("Could not log out. Check your connection and try again.");
			buttons.forEach((button) => { button.disabled = false; });
		}
	}

	function subscribeToAuthChanges() {
		supabase.auth.onAuthStateChange((event, session) => {
			if (event === "SIGNED_OUT" || event === "USER_DELETED" || !session) {
				revokeAccess("../auth/login.html");
				return;
			}
			if (session && currentUser && session.user.id !== currentUser.id) {
				revokeAccess("../auth/login.html");
				return;
			}
			if (event === "USER_UPDATED") {
				window.setTimeout(async () => {
					if (accessRevoked) return;
					try {
						const user = await getCurrentUser();
						if (user?.email?.toLowerCase() !== allowlistedAdminEmail || !user.email_confirmed_at) {
							revokeAccess("../auth/login.html");
						}
					} catch (error) {
						console.error("Could not re-verify the administrator role.", error);
						revokeAccess("../auth/login.html");
					}
				}, 0);
			}
		});
	}

	function revokeAccess(destination) {
		if (accessRevoked) return;
		accessRevoked = true;
		app.hidden = true;
		gate.hidden = false;
		gate.textContent = "Your admin session has ended. Redirecting...";
		window.location.replace(destination);
	}

	async function loadReports() {
		if (accessRevoked) return;
		const chart = document.querySelector("#registration-chart");
		const feed = document.querySelector("#activity-feed");
		chart.innerHTML = '<p class="table-empty">Loading registration data...</p>';
		feed.innerHTML = '<p class="table-empty">Loading recent activity...</p>';
		const start = new Date();
		start.setDate(1);
		start.setMonth(start.getMonth() - 5);
		let data;
		let count;
		try {
			const response = await supabase.from("profiles")
				.select("full_name, role, created_at", { count: "exact" })
				.gte("created_at", start.toISOString())
				.order("created_at", { ascending: false })
				.limit(1000);
			if (response.error) throw response.error;
			data = response.data;
			count = response.count;
		} catch (error) {
			console.error("Could not load registration analytics.", error);
			if (accessRevoked) return;
			chart.textContent = "Registration analytics are unavailable under current permissions.";
			feed.textContent = "Recent profile activity is unavailable under current permissions.";
			return;
		}
		if (accessRevoked) return;
		if (!data?.length) {
			chart.textContent = "No profile registrations in the last six months.";
			feed.textContent = "No recent profile activity.";
			return;
		}
		const months = Array.from({ length: 6 }, (_, index) => {
			const date = new Date(start.getFullYear(), start.getMonth() + index, 1);
			return { date, label: date.toLocaleDateString(undefined, { month: "short" }), count: 0 };
		});
		for (const profile of data || []) {
			const created = new Date(profile.created_at);
			const month = months.find((item) => item.date.getFullYear() === created.getFullYear() && item.date.getMonth() === created.getMonth());
			if (month) month.count++;
		}
		const maximum = Math.max(1, ...months.map((month) => month.count));
		chart.replaceChildren();
		const bars = document.createElement("div");
		bars.className = "chart-bars";
		for (const month of months) {
			const item = document.createElement("div");
			item.className = "chart-column";
			const value = document.createElement("span");
			value.textContent = String(month.count);
			const bar = document.createElement("div");
			bar.className = "chart-bar";
			bar.style.height = `${Math.max(4, month.count / maximum * 100)}%`;
			bar.setAttribute("aria-hidden", "true");
			const label = document.createElement("small");
			label.textContent = month.label;
			item.append(value, bar, label);
			bars.append(item);
		}
		chart.append(bars);
		if (count > (data || []).length) {
			const note = document.createElement("p");
			note.className = "chart-note";
			note.textContent = "Chart uses the latest 1,000 visible profiles; more records are available.";
			chart.append(note);
		}
		feed.replaceChildren();
		if (!data?.length) {
			feed.textContent = "No profile registrations in the last six months.";
			return;
		}
		for (const profile of data.slice(0, 8)) {
			const item = document.createElement("article");
			item.className = "activity-item";
			const title = document.createElement("strong");
			title.textContent = `${profile.full_name || "A user"} registered as ${profile.role || "user"}`;
			const date = document.createElement("time");
			date.dateTime = profile.created_at || "";
			date.textContent = displayDate(profile.created_at);
			item.append(title, date);
			feed.append(item);
		}
	}

	function renderProfileDetails(record) {
		if (accessRevoked) return;
		const dialog = document.querySelector("#profile-dialog");
		const details = document.querySelector("#profile-details");
		if (!record) return;
		const fields = [
			["Full name", record.full_name || "Not provided"],
			["Email", "Not available from the browser-safe profiles table"],
			["Role", record.role || "Not provided"],
			["Registration date", displayDate(record.created_at)]
		];
		if (record.role === "student") {
			fields.push(
				["Phone", "Not available in the confirmed profile schema"],
				["Course and enrollment", "Not available in the confirmed profile schema"],
				["Guardian or approval", "Not available in the confirmed profile schema"],
				["Support and access", "Not available in the confirmed profile schema"],
				["Account status", "Not tracked in the profiles schema"]
			);
		} else if (record.role === "instructor") {
			fields.push(
				["Instructor category", "Not tracked in the profiles schema"],
				["Assigned courses", "Not available in the confirmed schema"],
				["Assigned students", "Not available in the confirmed schema"],
				["Account status", "Not tracked in the profiles schema"]
			);
		}
		details.replaceChildren();
		for (const [label, value] of fields) {
			const row = document.createElement("div");
			const term = document.createElement("dt");
			const description = document.createElement("dd");
			term.textContent = label;
			description.textContent = value;
			row.append(term, description);
			details.append(row);
		}
		dialog.showModal();
	}

	function showProfileDetails(entity, index) {
		const profiles = entity === "student" ? visibleStudents : visibleInstructors;
		renderProfileDetails(profiles[index]);
	}

	async function searchDirectory(value) {
		const results = document.querySelector("#global-search-results");
		const input = document.querySelector("#global-search");
		const term = value.trim().replace(/[%_,]/g, "");
		if (!term) {
			globalSearchResults = [];
			results.hidden = true;
			input.setAttribute("aria-expanded", "false");
			results.replaceChildren();
			return;
		}
		results.hidden = false;
		input.setAttribute("aria-expanded", "true");
		results.textContent = "Searching profiles...";
		try {
			const pattern = `%${term}%`;
			const requests = ["student", "instructor"].map((role) => supabase.from("profiles")
				.select("id, full_name, role, created_at")
				.eq("role", role)
				.ilike("full_name", pattern)
				.limit(5));
			const resultsByRole = await Promise.all(requests);
			if (accessRevoked) return;
			const failed = resultsByRole.find((result) => result.error);
			if (failed) throw failed.error;
			globalSearchResults = resultsByRole.flatMap((result) => result.data || []);
			results.replaceChildren();
			if (!globalSearchResults.length) {
				results.textContent = "No student or instructor profiles found.";
				return;
			}
			globalSearchResults.forEach((profile, index) => {
				const button = document.createElement("button");
				button.type = "button";
				button.className = "search-result";
				button.dataset.globalResult = String(index);
				const name = document.createElement("strong");
				name.textContent = profile.full_name || "Name not provided";
				const role = document.createElement("small");
				role.textContent = profile.role;
				button.append(name, role);
				results.append(button);
			});
		} catch (error) {
			console.error("Directory search failed.", error);
			if (accessRevoked) return;
			results.textContent = "Directory search is unavailable under current permissions.";
		}
	}

	function scheduleDirectorySearch(value) {
		window.clearTimeout(studentSearchTimer);
		studentSearchTimer = window.setTimeout(() => {
			searchDirectory(value);
		}, 300);
	}

	document.querySelectorAll(".admin-nav [data-view]").forEach((link) => {
		link.addEventListener("click", (event) => {
			event.preventDefault();
			openView(link.dataset.view);
		});
	});
	document.querySelectorAll("[data-open-view]").forEach((button) => button.addEventListener("click", () => openView(button.dataset.openView)));
	document.querySelectorAll("[data-logout], #logout-button, #topbar-logout").forEach((button) => button.addEventListener("click", logout));
	document.querySelector("#student-search").addEventListener("input", () => {
		studentPage = 0;
		openView("students");
	});
	document.querySelector("#global-search").addEventListener("input", (event) => scheduleDirectorySearch(event.currentTarget.value));
	document.querySelector("#global-search-results").addEventListener("click", (event) => {
		const button = event.target.closest("[data-global-result]");
		if (!button) return;
		renderProfileDetails(globalSearchResults[Number(button.dataset.globalResult)]);
		document.querySelector("#global-search-results").hidden = true;
		document.querySelector("#global-search").setAttribute("aria-expanded", "false");
	});
	document.querySelector("#student-sort").addEventListener("change", () => {
		studentPage = 0;
		loadStudents();
	});
	document.querySelector("#students-previous").addEventListener("click", () => {
		if (studentPage > 0) {
			studentPage--;
			loadStudents();
		}
	});
	document.querySelector("#students-next").addEventListener("click", () => {
		if (!document.querySelector("#students-next").disabled) {
			studentPage++;
			loadStudents();
		}
	});
	document.querySelector("#students-table").addEventListener("click", (event) => {
		const button = event.target.closest("[data-detail-entity]");
		if (button) showProfileDetails(button.dataset.detailEntity, Number(button.dataset.detailIndex));
	});
	document.querySelector("#instructors-table").addEventListener("click", (event) => {
		const button = event.target.closest("[data-detail-entity]");
		if (button) showProfileDetails(button.dataset.detailEntity, Number(button.dataset.detailIndex));
	});
	document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => document.querySelector("#profile-dialog").close()));
	document.querySelector("#profile-dialog").addEventListener("click", (event) => {
		if (event.target === event.currentTarget) event.currentTarget.close();
	});
	document.querySelector("#sidebar-toggle").addEventListener("click", (event) => {
		const sidebar = document.querySelector("#admin-sidebar");
		const isOpen = sidebar.classList.toggle("is-open");
		event.currentTarget.setAttribute("aria-expanded", String(isOpen));
	});
	if (window.location.hash && document.querySelector(`[data-section="${window.location.hash.slice(1)}"]`)) {
		document.querySelectorAll("[data-section]").forEach((section) => { section.hidden = section.dataset.section !== window.location.hash.slice(1); });
		document.querySelectorAll(".admin-nav [data-view]").forEach((link) => link.classList.toggle("is-active", link.dataset.view === window.location.hash.slice(1)));
	}

	requireAdmin();
})();
