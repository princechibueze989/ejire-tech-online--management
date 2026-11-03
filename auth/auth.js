(() => {
	const supabase = window.ejireSupabase;
	const avatarBucket = "student-avatars";
	const avatarTypes = {
		"image/jpeg": "jpg",
		"image/png": "png",
		"image/webp": "webp"
	};
	function getAvatarExtension(type) {
		return Object.prototype.hasOwnProperty.call(avatarTypes, type) ? avatarTypes[type] : null;
	}
	const courses = [
		"Full Stack Development",
		"Frontend Development",
		"Vibe Coding & Google AdMob",
		"UI/UX & Graphics Design",
		"Mobile App Development",
		"AI & Automation",
		"AI Voice Agent Development"
	];
	const allowedValues = {
		age_group: ["Under 18", "18-24", "25-34", "35-44", "45+"],
		education_level: ["Secondary school", "College or university", "Graduate studies", "Other"],
		current_status: ["Student", "Working", "Looking for work", "Career changer", "Other"],
		experience_level: ["New to this", "Some experience", "Comfortable with the basics", "Experienced"],
		device_count: ["1", "2", "3 or more"],
		device_type: ["Smartphone", "Laptop", "Desktop computer", "Tablet", "Shared device"],
		internet_access: ["Reliable", "Sometimes unreliable", "Limited"]
	};

	function showStatus(element, message, kind = "info") {
		if (!element) return;
		element.textContent = message;
		element.dataset.kind = kind;
	}

	function friendlyError(error) {
		const message = String(error?.message || "").toLowerCase();
		if (message.includes("invalid login credentials") || message.includes("user not found")) {
			return "Email or password is incorrect. Check your details and try again.";
		}
		if (message.includes("email not confirmed")) {
			return "Confirm your email using the link we sent, then try logging in again.";
		}
		if (message.includes("password") && (message.includes("weak") || message.includes("short"))) {
			return "Choose a longer password and try again.";
		}
		if (message.includes("rate limit") || message.includes("too many")) {
			return "Too many attempts. Wait a little and try again.";
		}
		if (message.includes("failed to fetch") || message.includes("network")) {
			return "Could not reach the account service. Check your connection and try again.";
		}
		if (message.includes("redirect url") || message.includes("redirect_to")) {
			return "Supabase rejected the dashboard redirect. Add this site's /auth/student-dashboard.html URL to Authentication > URL Configuration > Redirect URLs.";
		}
		if (message.includes("registration requires an http or https address")) {
			return "Open Ejire Tech from its hosted HTTPS address or an HTTP localhost server. Supabase cannot redirect email confirmation to a file:// page.";
		}
		if (message.includes("supabase") || !supabase) {
			return "Account services are not configured. Add the existing Supabase project URL and anon key to supabase-client.js.";
		}
		return "We could not complete that request. Please try again or contact support.";
	}

	function signupError(error) {
		const message = String(error?.message || "").toLowerCase();
		if (message.includes("database error saving new user")) {
			return "Supabase could not save this account. Check the project's Auth logs for a database trigger or profile-table error before trying again.";
		}
		if (message.includes("error sending confirmation email") || message.includes("email rate limit")) {
			return "Supabase could not send the confirmation email. Check the project's Auth logs and SMTP/email provider settings, then check Auth > Users before retrying.";
		}
		return friendlyError(error);
	}

	async function getCurrentUser() {
		const { data, error } = await supabase.auth.getUser();
		if (error) throw error;
		return data.user;
	}

	async function getCurrentProfile(userId) {
		const { data, error } = await supabase
			.from("profiles")
			.select("id, full_name, role")
			.eq("id", userId)
			.maybeSingle();
		if (error) throw error;
		return data;
	}

	function redirectByRole(role) {
		if (role === "admin") {
			window.location.replace("../admin/dashboard.html");
			return;
		}
		if (role === "student") {
			window.location.replace("student-dashboard.html");
			return;
		}
		if (role === "instructor") {
			window.location.replace("portal.html?role=instructor");
			return;
		}
		throw new Error("Your account does not have an assigned role. Contact an administrator.");
	}

	function setBusy(button, busy, label) {
		button.disabled = busy;
		button.textContent = busy ? label : button.dataset.defaultLabel;
	}

	function avatarError(error) {
		const message = String(error?.message || "").toLowerCase();
		if (message.includes("bucket not found") || message.includes("row-level security") || message.includes("not authorized")) {
			return "Profile picture storage is not ready. Run the student-avatars setup in supabase-auth-hardening.sql, then try again.";
		}
		return "We could not update your profile picture. Check your connection and try again.";
	}

	function initializePasswordToggles() {
		document.querySelectorAll("[data-password-toggle]").forEach((button) => {
			const input = document.getElementById(button.getAttribute("aria-controls"));
			if (!input) return;
			button.addEventListener("click", () => {
				const visible = input.type === "password";
				input.type = visible ? "text" : "password";
				button.textContent = visible ? "Hide" : "Show";
				button.setAttribute("aria-pressed", String(visible));
			});
		});
	}

	function initializeLogin() {
		const form = document.querySelector("#login-form");
		if (!form) return;

		const status = form.querySelector(".auth-status");
		const button = form.querySelector('button[type="submit"]');
		button.dataset.defaultLabel = button.textContent;
		form.addEventListener("submit", async (event) => {
			event.preventDefault();
			if (!form.reportValidity()) return;
			setBusy(button, true, "Logging in...");
			showStatus(status, "Signing you in...");
			try {
				if (!supabase) throw new Error("Supabase client is not configured.");
				const { data, error } = await supabase.auth.signInWithPassword({
					email: form.querySelector("#email").value.trim(),
					password: form.querySelector("#password").value
				});
				if (error) throw error;
				if (!data.user) throw new Error("The account service did not return a signed-in user.");
				const profile = await getCurrentProfile(data.user.id);
				if (!profile) throw new Error("Your profile is not available yet. Contact an administrator.");
				redirectByRole(profile.role);
			} catch (error) {
				showStatus(status, friendlyError(error), "error");
				setBusy(button, false);
			}
		});

		const recoveryLink = document.querySelector("#show-recovery");
		const recoveryForm = document.querySelector("#recovery-form");
		recoveryLink?.addEventListener("click", (event) => {
			event.preventDefault();
			recoveryForm.hidden = false;
			recoveryForm.querySelector("#recovery-email").value = form.querySelector("#email").value.trim();
			recoveryForm.querySelector("#recovery-email").focus();
		});
		recoveryForm?.addEventListener("submit", async (event) => {
			event.preventDefault();
			if (!recoveryForm.reportValidity()) return;
			const recoveryStatus = recoveryForm.querySelector(".auth-status");
			const recoveryButton = recoveryForm.querySelector('button[type="submit"]');
			recoveryButton.dataset.defaultLabel = recoveryButton.textContent;
			setBusy(recoveryButton, true, "Sending link...");
			showStatus(recoveryStatus, "Sending a secure password reset link...");
			try {
				if (!supabase) throw new Error("Supabase client is not configured.");
				const { error } = await supabase.auth.resetPasswordForEmail(
					recoveryForm.querySelector("#recovery-email").value.trim(),
					{ redirectTo: new URL("reset-password.html", window.location.href).href }
				);
				if (error) throw error;
				showStatus(recoveryStatus, "If an account exists for that email, a password reset link is on its way.", "success");
			} catch (error) {
				showStatus(recoveryStatus, friendlyError(error), "error");
			} finally {
				setBusy(recoveryButton, false);
			}
		});

		if (supabase) {
			supabase.auth.getSession().then(async ({ data, error }) => {
				if (error) throw error;
				if (!data.session) return;
				const user = await getCurrentUser();
				if (!user) return;
				const profile = await getCurrentProfile(user.id);
				if (profile) redirectByRole(profile.role);
			}).catch((error) => showStatus(status, friendlyError(error), "error"));
		}
	}

	function validateEnrollment(form) {
		const selectedCourse = form.querySelector("#course").value;
		if (!courses.includes(selectedCourse)) {
			throw new Error("Choose a valid learning path.");
		}
		for (const [field, values] of Object.entries(allowedValues)) {
			const value = form.elements[field]?.value;
			if (value && !values.includes(value)) {
				throw new Error("Review your learning profile and choose a listed option.");
			}
		}
		const fullName = form.querySelector("#name").value.trim();
		const learningGoal = form.querySelector("#learning-goal").value.trim();
		if (fullName.length < 2) throw new Error("Enter your full name.");
		if (learningGoal.length < 10) throw new Error("Tell us a little more about what you want to achieve.");

		return {
			full_name: fullName,
			course: selectedCourse,
			age_group: form.elements.age_group.value,
			education_level: form.elements.education_level.value,
			class_year: form.elements.class_year.value.trim(),
			current_status: form.elements.current_status.value,
			experience_level: form.elements.experience_level.value,
			learning_goal: learningGoal,
			device_access: `${form.elements.device_count.value} device${form.elements.device_count.value === "1" ? "" : "s"}; ${form.elements.device_type.value}`,
			internet_access: form.elements.internet_access.value
		};
	}

	function getRegistrationRedirectUrl() {
		if (window.location.protocol !== "http:" && window.location.protocol !== "https:") {
			throw new Error("Registration requires an HTTP or HTTPS address.");
		}
		return new URL("student-dashboard.html", window.location.href).href;
	}

	function initializeRegistration() {
		const form = document.querySelector("#register-form");
		if (!form) return;

		const status = form.querySelector(".auth-status");
		const button = form.querySelector('button[type="submit"]');
		button.dataset.defaultLabel = button.textContent;
		const password = form.querySelector("#password");
		const confirmation = form.querySelector("#confirm-password");
		const strength = form.querySelector("#password-strength");
		const classYearField = form.querySelector("#class-year-field");

		password.addEventListener("input", () => {
			const length = password.value.length;
			strength.textContent = length === 0 ? "" : length < 10 ? "Add more characters for a stronger password." : length < 14 ? "Good length. A longer passphrase is even better." : "Strong passphrase length.";
			confirmation.setCustomValidity(confirmation.value && confirmation.value !== password.value ? "The passwords do not match." : "");
		});
		confirmation.addEventListener("input", () => {
			confirmation.setCustomValidity(confirmation.value && confirmation.value !== password.value ? "The passwords do not match." : "");
		});

		form.elements.education_level.addEventListener("change", () => {
			const showYear = ["Secondary school", "College or university", "Graduate studies"].includes(form.elements.education_level.value);
			classYearField.hidden = !showYear;
			if (!showYear) form.elements.class_year.value = "";
		});

		const selectedCourse = new URLSearchParams(window.location.search).get("course");
		if (courses.includes(selectedCourse)) form.querySelector("#course").value = selectedCourse;

		form.addEventListener("submit", async (event) => {
			event.preventDefault();
			if (!form.reportValidity()) return;
			const button = form.querySelector('button[type="submit"]');
			try {
				const onboarding = validateEnrollment(form);
				const emailRedirectTo = getRegistrationRedirectUrl();
				if (!supabase) throw new Error("Supabase client is not configured.");
				setBusy(button, true, "Creating account...");
				showStatus(status, "Creating your student account...");
				const { data, error } = await supabase.auth.signUp({
					email: form.querySelector("#email").value.trim(),
					password: password.value,
					options: {
						data: onboarding,
						emailRedirectTo
					}
				});
				if (error) throw error;
				if (!data.user) throw new Error("The account service did not return an account.");
				if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
					form.reset();
					classYearField.hidden = true;
					showStatus(status, "If an account already exists for this email, log in or use Forgot password? to regain access.", "success");
					return;
				}
				if (data.session) {
					const profile = await getCurrentProfile(data.user.id);
					if (!profile) {
						throw new Error("Your account was created, but its student profile is not ready. Contact support before trying again.");
					}
					redirectByRole(profile.role);
					return;
				}
				password.value = "";
				confirmation.value = "";
				showStatus(status, "Your account is ready. Check your email and click the confirmation link to open your student dashboard. If you have already confirmed your email, log in to continue.", "success");
			} catch (error) {
				showStatus(status, error.message === "Choose a valid learning path." || error.message === "Enter your full name." || error.message === "Tell us a little more about what you want to achieve." || error.message === "Review your learning profile and choose a listed option."
					? error.message
					: signupError(error), "error");
			} finally {
				setBusy(button, false);
			}
		});
	}

	function initializePasswordReset() {
		const form = document.querySelector("#reset-password-form");
		if (!form) return;
		const status = form.querySelector(".auth-status");
		const button = form.querySelector('button[type="submit"]');
		const password = form.querySelector("#new-password");
		const confirmation = form.querySelector("#confirm-new-password");
		button.dataset.defaultLabel = button.textContent;
		confirmation.addEventListener("input", () => {
			confirmation.setCustomValidity(confirmation.value && confirmation.value !== password.value ? "The passwords do not match." : "");
		});
		password.addEventListener("input", () => {
			confirmation.setCustomValidity(confirmation.value && confirmation.value !== password.value ? "The passwords do not match." : "");
		});
		form.addEventListener("submit", async (event) => {
			event.preventDefault();
			if (!form.reportValidity()) return;
			setBusy(button, true, "Updating password...");
			showStatus(status, "Updating your password...");
			try {
				if (!supabase) throw new Error("Supabase client is not configured.");
				const { data, error } = await supabase.auth.updateUser({ password: password.value });
				if (error) throw error;
				if (!data.user) throw new Error("The account service did not confirm the password update.");
				showStatus(status, "Your password has been updated. You can now continue to your account.", "success");
				form.reset();
			} catch (error) {
				showStatus(status, friendlyError(error), "error");
			} finally {
				setBusy(button, false);
			}
		});
	}

	async function initializeStudentDashboard() {
		const dashboard = document.querySelector("#student-dashboard");
		if (!dashboard) return;
		const status = document.querySelector("#dashboard-status");
		const logoutButton = document.querySelector("#dashboard-logout");
		const avatarForm = document.querySelector("#avatar-form");
		const avatarFile = document.querySelector("#avatar-file");
		const avatarUploadButton = document.querySelector("#avatar-upload");
		const avatarRemoveButton = document.querySelector("#avatar-remove");
		const avatarImage = document.querySelector("#student-avatar");
		const avatarPlaceholder = document.querySelector("#student-avatar-placeholder");
		let currentAvatarPath = null;
		avatarUploadButton.dataset.defaultLabel = avatarUploadButton.textContent;

		function setAvatarPlaceholder(name) {
			avatarImage.onerror = null;
			avatarImage.hidden = true;
			avatarImage.removeAttribute("src");
			avatarPlaceholder.textContent = name.trim().charAt(0).toUpperCase() || "S";
			avatarPlaceholder.hidden = false;
			avatarRemoveButton.hidden = true;
		}

		async function loadAvatar(path, userId, name) {
			if (!path) {
				setAvatarPlaceholder(name);
				return;
			}
			if (typeof path !== "string" || !path.startsWith(`${userId}/`)) {
				throw new Error("The saved profile picture path is invalid.");
			}
			const { data, error } = await supabase.storage.from(avatarBucket).createSignedUrl(path, 3600);
			if (error) throw error;
			if (!data?.signedUrl) throw new Error("The profile picture could not be loaded.");
			avatarImage.onerror = () => {
				setAvatarPlaceholder(name);
				showStatus(status, "Your saved profile picture could not be displayed. You can upload another one.", "error");
			};
			avatarImage.src = data.signedUrl;
			avatarImage.hidden = false;
			avatarPlaceholder.hidden = true;
			avatarRemoveButton.hidden = false;
		}

		try {
			if (!supabase) throw new Error("Supabase client is not configured.");
			const user = await getCurrentUser();
			if (!user) {
				window.location.replace("login.html");
				return;
			}
			const profile = await getCurrentProfile(user.id);
			if (!profile) throw new Error("Your profile is not available yet. Contact an administrator.");
			if (profile.role !== "student") {
				redirectByRole(profile.role);
				return;
			}

			const details = user.user_metadata || {};
			document.querySelector("#student-name").textContent = profile.full_name || details.full_name || "Student";
			document.querySelector("#student-email").textContent = user.email || "Email unavailable";
			document.querySelector("#student-course").textContent = details.course || "No learning path selected";
			document.querySelector("#student-experience").textContent = details.experience_level || "Not provided";
			document.querySelector("#student-goal").textContent = details.learning_goal || "Add your learning goal during registration.";
			document.querySelector("#student-devices").textContent = details.device_access || "Not provided";
			document.querySelector("#student-status").textContent = details.current_status || "Not provided";
			document.querySelector("#student-age").textContent = details.age_group || "Not provided";
			document.querySelector("#student-education").textContent = details.education_level || "Not provided";
			document.querySelector("#student-class-year").textContent = details.class_year || "Not provided";
			document.querySelector("#student-internet").textContent = details.internet_access || "Not provided";
			dashboard.hidden = false;
			document.querySelector("#dashboard-gate").hidden = true;
			setAvatarPlaceholder(profile.full_name || details.full_name || "Student");
			currentAvatarPath = details.avatar_path || null;
			try {
				await loadAvatar(currentAvatarPath, user.id, profile.full_name || details.full_name || "Student");
			} catch (error) {
				showStatus(status, avatarError(error), "error");
			}

			avatarFile.addEventListener("change", () => {
				const file = avatarFile.files[0];
				const valid = !file || (getAvatarExtension(file.type) && file.size <= 5 * 1024 * 1024);
				avatarUploadButton.disabled = !file || !valid;
				if (file && !valid) {
					showStatus(status, "Choose a JPG, PNG, or WebP image no larger than 5 MB.", "error");
				} else if (file) {
					showStatus(status, "");
				}
			});

			avatarForm.addEventListener("submit", async (event) => {
				event.preventDefault();
				const file = avatarFile.files[0];
				if (!file) return;
				const extension = getAvatarExtension(file.type);
				if (!extension || file.size > 5 * 1024 * 1024) {
					showStatus(status, "Choose a JPG, PNG, or WebP image no larger than 5 MB.", "error");
					return;
				}
				setBusy(avatarUploadButton, true, "Uploading...");
				avatarFile.disabled = true;
				avatarRemoveButton.disabled = true;
				showStatus(status, "Uploading your profile picture...");
				const newPath = `${user.id}/${Date.now()}.${extension}`;
				try {
					const { error: uploadError } = await supabase.storage
						.from(avatarBucket)
						.upload(newPath, file, { cacheControl: "3600", contentType: file.type, upsert: false });
					if (uploadError) throw uploadError;
					const { error: profileError } = await supabase.auth.updateUser({ data: { avatar_path: newPath } });
					if (profileError) {
						const { error: cleanupError } = await supabase.storage.from(avatarBucket).remove([newPath]);
						if (cleanupError) {
							throw new Error("Your profile picture could not be saved or cleaned up. Contact support before trying again.");
						}
						throw profileError;
					}
					const previousPath = currentAvatarPath;
					currentAvatarPath = newPath;
					let avatarDisplayError = false;
					try {
						await loadAvatar(currentAvatarPath, user.id, profile.full_name || details.full_name || "Student");
					} catch {
						avatarDisplayError = true;
						setAvatarPlaceholder(profile.full_name || details.full_name || "Student");
					}
					avatarFile.value = "";
					avatarUploadButton.disabled = true;
					if (previousPath) {
						const { error: removeError } = await supabase.storage.from(avatarBucket).remove([previousPath]);
						if (removeError) {
							showStatus(status, "Your picture was updated, but the previous file could not be removed.", "error");
							return;
						}
					}
					showStatus(status,
						avatarDisplayError
							? "Your picture was uploaded, but could not be displayed. Refresh the page or try another picture."
							: "Your profile picture has been updated.",
						avatarDisplayError ? "error" : "success");
				} catch (error) {
					showStatus(status, error.message?.includes("could not be saved or cleaned up")
						? error.message
						: avatarError(error), "error");
				} finally {
					setBusy(avatarUploadButton, false);
					avatarFile.disabled = false;
					avatarRemoveButton.disabled = false;
					avatarUploadButton.disabled = !avatarFile.files[0];
				}
			});

			avatarRemoveButton.addEventListener("click", async () => {
				if (!currentAvatarPath) return;
				avatarRemoveButton.disabled = true;
				avatarFile.disabled = true;
				avatarUploadButton.disabled = true;
				showStatus(status, "Removing your profile picture...");
				try {
					const previousPath = currentAvatarPath;
					const { error: profileError } = await supabase.auth.updateUser({ data: { avatar_path: null } });
					if (profileError) throw profileError;
					currentAvatarPath = null;
					setAvatarPlaceholder(profile.full_name || details.full_name || "Student");
					const { error: removeError } = await supabase.storage.from(avatarBucket).remove([previousPath]);
					if (removeError) {
						showStatus(status, "Your picture was removed from your profile, but its file could not be deleted.", "error");
						return;
					}
					showStatus(status, "Your profile picture has been removed.", "success");
				} catch (error) {
					showStatus(status, avatarError(error), "error");
				} finally {
					avatarRemoveButton.disabled = false;
					avatarFile.disabled = false;
					avatarUploadButton.disabled = !avatarFile.files[0];
				}
			});

			logoutButton.addEventListener("click", async () => {
				logoutButton.disabled = true;
				try {
					const { error } = await supabase.auth.signOut();
					if (error) throw error;
					window.location.replace("login.html");
				} catch (error) {
					showStatus(status, friendlyError(error), "error");
					logoutButton.disabled = false;
				}
			});
		} catch (error) {
			showStatus(status, friendlyError(error), "error");
		}
	}

	async function initializePortal() {
		const status = document.querySelector("#portal-status");
		const title = document.querySelector("#portal-title");
		const logoutButton = document.querySelector("#portal-logout");
		if (!status || !title) return;
		const requestedRole = new URLSearchParams(window.location.search).get("role");
		try {
			if (!supabase) throw new Error("Supabase client is not configured.");
			const user = await getCurrentUser();
			if (!user) {
				window.location.replace("login.html");
				return;
			}
			const profile = await getCurrentProfile(user.id);
			if (!profile) throw new Error("Your profile is not available yet. Contact an administrator.");
			if (profile.role !== requestedRole || profile.role !== "instructor") {
				redirectByRole(profile.role);
				return;
			}
			title.textContent = "Instructor area";
			showStatus(status, "Your instructor access is verified. The instructor workspace is being prepared.", "success");
			logoutButton.addEventListener("click", async () => {
				logoutButton.disabled = true;
				try {
					const { error } = await supabase.auth.signOut();
					if (error) throw error;
					window.location.replace("login.html");
				} catch (error) {
					showStatus(status, friendlyError(error), "error");
					logoutButton.disabled = false;
				}
			});
		} catch (error) {
			showStatus(status, friendlyError(error), "error");
		}
	}

	initializePasswordToggles();
	initializeLogin();
	initializeRegistration();
	initializePasswordReset();
	initializeStudentDashboard();
	initializePortal();
})();
