# Person Card Collection

A modern, fast, and elegant web application for browsing, searching, and creating personal profile cards backed by Supabase.

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Supabase (PostgreSQL Database, Storage, and Realtime)
- **Deployment**: Vercel ready

---

## Supabase Setup Instructions

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Under **Project Settings** -> **API**, copy:
   - **Project URL**
   - **anon / public key** (or **publishable key**)

### 2. Configure Database & Storage
1. Open the **SQL Editor** in your Supabase Dashboard.
2. Copy and paste the contents of `supabase/schema.sql` and click **Run**.
   - Creates the `people` table
   - Creates search and sort indexes
   - Configures Row Level Security (public read + public insert)
   - Creates the public `person-photos` storage bucket and access policies
   - Enables Realtime replication on `people`
3. (Optional) Run `supabase/seed.sql` to insert the 6 demo person cards.

---

## Environment Variables

Create a `.env` file in the root directory (refer to `.env.example`):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-or-publishable-key
```

*Note: Backward compatibility is included for `VITE_SUPABASE_ANON_KEY`.*

---

## Vercel Deployment

1. Import your GitHub repository into Vercel.
2. In the Vercel project settings under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase anon/publishable key
3. Deploy! No secret keys or server-side functions are required.
