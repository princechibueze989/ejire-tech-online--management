(() => {
	const supabase = window.ejireSupabase;
	const courses = [
		"Full Stack Development",
		"Frontend Development",
		"Vibe Coding & Google AdMob",
		"UI/UX & Graphics Design",
		"Mobile App Development",
		"AI & Automation",
		"AI Voice Agent Development"
	];
	const app = document.querySelector("#admin-app");
	const gate = document.querySelector("#admin-gate");
	const status = document.querySelector("#dashboard-status");
	let currentUser = null;
	let currentProfile = null;
	const loadedViews = new Set();

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

	function roleDestination(role) {
		if (role === "student") {
			return "../auth/student-dashboard.html";
		}
		if (role === "instructor") {
			return `../auth/portal.html?role=${encodeURIComponent(role)}`;
		}
		return "../auth/login.html";
	}

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
			currentProfile = await getCurrentProfile(currentUser.id);
			if (!currentProfile || currentProfile.role !== "admin") {
				gate.textContent = currentProfile ? "Admin access is restricted. Redirecting to your account area..." : "Your profile is unavailable. Redirecting to sign in...";
				window.setTimeout(() => window.location.replace(roleDestination(currentProfile?.role)), 900);
				return;
			}
			gate.hidden = true;
			app.hidden = false;
			document.querySelector("#admin-identity").textContent = currentProfile.full_name || currentUser.email || "Administrator";
			document.querySelector("#settings-name").textContent = currentProfile.full_name || "Not provided";
			document.querySelector("#settings-email").textContent = currentUser.email || "Not available";
			document.querySelector("#current-date").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
			fillCourseViews();
			subscribeToAuthChanges();
			await loadOverview();
		} catch (error) {
			gate.textContent = error.message?.toLowerCase().includes("supabase")
				? "Admin dashboard is unavailable. Add the existing Supabase project URL and anon key to supabase-client.js."
				: "Could not verify admin access. Check your connection and try again.";
		}
	}

	function fillCourseViews() {
		const list = document.querySelector("#overview-course-list");
		const grid = document.querySelector("#course-grid");
		for (const course of courses) {
			const listItem = document.createElement("li");
			listItem.textContent = course;
			list.append(listItem);
			const card = document.createElement("article");
			card.className = "course-item";
			const title = document.createElement("h2");
			title.textContent = course;
			const label = document.createElement("p");
			label.textContent = "Learning path";
			card.append(title, label);
			grid.append(card);
		}
	}

	async function loadCount(table, role) {
		let query = supabase.from(table).select("id", { count: "exact", head: true });
		if (role) query = query.eq("role", role);
		const { count, error } = await query;
		if (error) throw error;
		return count ?? 0;
	}

	async function loadOverview() {
		const requests = [
			["#total-students", () => loadCount("profiles", "student")],
			["#total-instructors", () => loadCount("profiles", "instructor")],
			["#total-enrollments", () => loadCount("student_enrollments")]
		];
		const results = await Promise.allSettled(requests.map(([, request]) => request()));
		results.forEach((result, index) => {
			document.querySelector(requests[index][0]).textContent = result.status === "fulfilled" ? String(result.value) : "--";
		});
		if (results.some((result) => result.status === "rejected")) {
			showStatus("Some totals are unavailable under the current Supabase row-level security policies.");
		}
		loadedViews.add("overview");
		await loadRecentEnrollments();
	}

	async function loadRecentEnrollments() {
		const body = document.querySelector("#recent-enrollments");
		const { data, error } = await supabase.from("student_enrollments").select("*").order("created_at", { ascending: false }).limit(5);
		if (error) {
			setRows(body, [], 3, "Enrollment records are unavailable under current permissions.");
			return;
		}
		setRows(body, (data || []).map((row) => [
			firstValue(row, ["course", "course_name", "selected_course"]),
			firstValue(row, ["status", "current_status"]),
			displayDate(row.created_at)
		]), 3, "No enrollment records found.");
	}

	async function loadStudents() {
		const body = document.querySelector("#students-table");
		const { data, error } = await supabase.from("profiles").select("id, full_name, role, created_at").eq("role", "student").order("created_at", { ascending: false });
		if (error) {
			setRows(body, [], 4, "Student profiles are unavailable under current permissions.");
			showStatus("Could not load student profiles. Check the profiles table RLS policies.");
			return;
		}
		setRows(body, (data || []).map((profile) => [profile.full_name || "Not provided", "Not available", profile.role, displayDate(profile.created_at)]), 4, "No student profiles found.");
	}

	async function loadInstructors() {
		const body = document.querySelector("#instructors-table");
		const { data, error } = await supabase.from("profiles").select("id, full_name, role, created_at").eq("role", "instructor").order("created_at", { ascending: false });
		if (error) {
			setRows(body, [], 3, "Instructor profiles are unavailable under current permissions.");
			showStatus("Could not load instructor profiles. Check the profiles table RLS policies.");
			return;
		}
		setRows(body, (data || []).map((profile) => [profile.full_name || "Not provided", profile.role, displayDate(profile.created_at)]), 3, "No instructor profiles found.");
	}

	async function loadEnrollments() {
		const body = document.querySelector("#enrollments-table");
		const { data, error } = await supabase.from("student_enrollments").select("*").order("created_at", { ascending: false });
		if (error) {
			setRows(body, [], 9, "Enrollment records are unavailable under current permissions.");
			showStatus("Could not load enrollments. Check the student_enrollments RLS policies.");
			return;
		}
		const fields = [
			["course", "course_name", "selected_course"],
			["age_group", "age"],
			["education_level", "education"],
			["class_year", "year_of_study"],
			["current_status", "status"],
			["experience_level", "experience"],
			["learning_goal", "goal"],
			["device_access", "device"],
			["created_at"]
		];
		setRows(body, (data || []).map((row) => fields.map((keys, index) => index === 8 ? displayDate(row.created_at) : firstValue(row, keys))), 9, "No enrollment records found.");
	}

	async function openView(name) {
		document.querySelectorAll("[data-section]").forEach((section) => { section.hidden = section.dataset.section !== name; });
		document.querySelectorAll(".admin-nav [data-view]").forEach((link) => link.classList.toggle("is-active", link.dataset.view === name));
		document.querySelector("#admin-sidebar").classList.remove("is-open");
		document.querySelector("#sidebar-toggle").setAttribute("aria-expanded", "false");
		history.replaceState(null, "", `#${name}`);
		showStatus("");
		if (loadedViews.has(name)) return;
		loadedViews.add(name);
		if (name === "students") await loadStudents();
		if (name === "instructors") await loadInstructors();
		if (name === "enrollments") await loadEnrollments();
	}

	async function logout() {
		const buttons = document.querySelectorAll("[data-logout], #logout-button, #topbar-logout");
		buttons.forEach((button) => { button.disabled = true; });
		const { error } = await supabase.auth.signOut();
		if (error) {
			showStatus("Could not log out. Please try again.");
			buttons.forEach((button) => { button.disabled = false; });
			return;
		}
		window.location.replace("../auth/login.html");
	}

	function subscribeToAuthChanges() {
		supabase.auth.onAuthStateChange((event) => {
			if (event === "SIGNED_OUT") window.location.replace("../auth/login.html");
		});
	}

	document.querySelectorAll(".admin-nav [data-view]").forEach((link) => {
		link.addEventListener("click", (event) => {
			event.preventDefault();
			openView(link.dataset.view);
		});
	});
	document.querySelectorAll("[data-open-view]").forEach((button) => button.addEventListener("click", () => openView(button.dataset.openView)));
	document.querySelectorAll("[data-logout], #logout-button, #topbar-logout").forEach((button) => button.addEventListener("click", logout));
	document.querySelector("#sidebar-toggle").addEventListener("click", (event) => {
		const sidebar = document.querySelector("#admin-sidebar");
		const isOpen = sidebar.classList.toggle("is-open");
		event.currentTarget.setAttribute("aria-expanded", String(isOpen));
	});

	requireAdmin();
})();
