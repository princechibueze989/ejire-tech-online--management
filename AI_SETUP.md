# Student AI Study Assistant Setup

The student assistant streams Groq responses through a Supabase Edge Function. The Groq secret is server-side only. Do not put it in `student.html`, `supabase-client-config.js`, browser storage, or a chat message.

## 1. Configure the Supabase browser client

In `supabase-client-config.js`, set the Supabase project URL and the project's publishable/anon key. These browser values are public identifiers, not secrets; protect all data with RLS. Serve this static site over HTTP (for example, VS Code Live Server at `http://localhost:5500`), not `file://`.

## 2. Configure student profiles

Link the project with the Supabase CLI, then apply the included migration:

```powershell
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

The migration creates a `profiles` row with the `student` role for each new auth signup and only allows a user to read their own profile. The signup form never accepts a role. Do not add a client policy that lets users insert or update their own role. Assign staff roles only through trusted administrative tooling.

For existing accounts, create/verify profiles and assign roles through the Supabase dashboard or another trusted administrative process. Do not bulk-mark existing accounts as students without reviewing them.

The class timetable migration creates an RLS-protected weekly schedule. Assign instructor roles only through trusted administrative tooling. Instructors then sign in at `instructor.html` and add or maintain recurring class times. All listed class times pause Study AI for every student, using the `Africa/Lagos` timezone. Study AI stays paused until at least one class time is configured; timetable read errors also fail closed.

## 3. Add the Groq secret and application origin

In Supabase Dashboard > Edge Functions > Secrets, add:

- `GROQ_API_KEY`: your Groq API key
- `STUDENT_APP_ORIGIN`: the exact origin where the site is hosted, with no trailing slash, such as `https://students.example.com`
- `GROQ_MODEL` (optional): model ID enabled for your Groq account; defaults to `llama-3.3-70b-versatile`

Never send the Groq key in chat or commit it to this repository. Supabase provides `SUPABASE_URL` and `SUPABASE_ANON_KEY` to Edge Functions.

For local testing, the Edge Function allows `http://localhost:5500`, `http://127.0.0.1:5500`, `http://localhost:8000`, and `http://127.0.0.1:8000`. Add your production origin to `STUDENT_APP_ORIGIN`.

## 4. Deploy the function

```powershell
supabase functions deploy student-ai
```

The function requires a valid Supabase JWT, looks up the authenticated user's `profiles.role`, checks the weekly class timetable using `Africa/Lagos` time, and only calls Groq for `student` profiles when no class is in session. It does not query grades, payments, messages, or other student records. The system prompt is held server-side and responses stream to the browser as server-sent events.

## 5. Verify

1. Configure Supabase email/password auth and the browser URL/key.
2. Verify an instructor account has the `instructor` role, then sign in at `instructor.html` and add the recurring class times.
3. Create a student through the registration page, or verify an existing profile has the `student` role.
4. Set the Groq secret in Supabase; do not put it in any client file.
5. Open `student.html` through the same HTTP origin, sign in, and open **Study AI**. The assistant is disabled during scheduled class times.

Without a configured Supabase client and signed-in student session, the chat stays disabled and explains what setup is missing. Messages are sent to Groq for inference and are not saved by this app.
