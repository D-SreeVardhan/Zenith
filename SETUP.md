# InstantDB Full-Stack Setup Guide

Your habits tracking app has been successfully migrated to use InstantDB for authentication and data sync!

## ✅ Completed

- ✅ InstantDB packages installed (`@instantdb/react`, `@instantdb/admin`)
- ✅ Schema defined with user-scoped entities (habits, events, eventTasks, activityLogs)
- ✅ Repository implementation using InstantDB
- ✅ Auth components (Login with magic code, email verification)
- ✅ Auth provider and route handlers integrated
- ✅ User profile dropdown with logout in header
- ✅ Local data migration logic (auto-migrates on first login)
- ✅ Zustand store updated to use InstantDB
- ✅ All entities have `userId` field for multi-user support
- ✅ Build successful!

## 🚀 Quick Start

### 1. Create Environment File

Create a `.env.local` file in the project root:

```bash
# In the project directory
echo "NEXT_PUBLIC_INSTANT_APP_ID=dbba4d97-dd31-48bb-a85e-727712cccbc9" > .env.local
```

Your InstantDB App ID is already configured: `dbba4d97-dd31-48bb-a85e-727712cccbc9`

### 2. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` - you should be redirected to `/auth/login`

### 3. Test Authentication

1. Enter your email address
2. InstantDB will send a magic code to your email
3. Enter the code to sign in
4. You'll be redirected to the dashboard
5. Any existing local data will automatically migrate to the cloud

### 4. Test Features

- **Create habits, events, and tasks** - everything syncs to InstantDB
- **Check the header** - your email should appear in the top-right with a profile dropdown
- **Log out** - click your profile → Sign Out
- **Multi-device sync** - log in on another browser/device to see your data sync

## 📁 Key Files Created/Modified

### New Files:
- `instant.schema.ts` - Database schema
- `src/lib/instantdb.ts` - InstantDB initialization
- `src/lib/config.ts` - Environment config
- `src/lib/repo/instantDbRepo.ts` - Cloud database repository
- `src/lib/migration/migrateLocalData.ts` - Migration logic
- `src/components/auth/LoginForm.tsx` - Email entry form
- `src/components/auth/VerifyCodeForm.tsx` - Code verification
- `src/components/shell/UserProfileDropdown.tsx` - User menu
- `src/app/auth/login/page.tsx` - Login page
- `src/app/api/instant/route.ts` - Auth cookie handler

### Modified Files:
- `src/lib/types.ts` - Added `userId` to all interfaces
- `src/store/useAppStore.ts` - Uses InstantDB repository
- `src/app/layout.tsx` - InstantDB provider wrapper
- `src/app/(shell)/layout.tsx` - Auth guards + migration trigger
- `src/components/shell/AppHeader.tsx` - User profile display
- All page components - Added `export const dynamic = 'force-dynamic'`

## 🌐 Vercel Deployment

When you're ready to deploy:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add InstantDB authentication and cloud sync"
   git push origin main
   ```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Add environment variable:
     - Name: `NEXT_PUBLIC_INSTANT_APP_ID`
     - Value: `dbba4d97-dd31-48bb-a85e-727712cccbc9`
   - Deploy!

3. **InstantDB Configuration** (if needed):
   - Go to [instantdb.com/dash](https://instantdb.com/dash)
   - Add your Vercel domain to allowed origins

## 📊 InstantDB Free Plan Limits

- ✅ 5GB storage
- ✅ 100,000 operations/month
- ✅ Unlimited bandwidth
- ✅ Real-time sync
- ✅ Built-in authentication

Perfect for personal use!

## 🔒 Security Features

- ✅ All data scoped to authenticated users via `userId`
- ✅ Secure auth cookie management
- ✅ Permissions enforced at database level
- ✅ Magic code authentication (no passwords to manage)
- ✅ Automatic token refresh

## 🐛 Troubleshooting

### Build Errors
The app successfully builds! If you see any TypeScript errors, run:
```bash
npm run build
```

### Authentication Not Working
1. Check `.env.local` file exists with correct App ID
2. Verify InstantDB dashboard shows your app
3. Check browser console for errors

### Data Not Syncing
1. Ensure you're logged in (check profile dropdown in header)
2. Open browser DevTools → Network tab
3. Look for requests to InstantDB API
4. Check for any error responses

## 📖 Next Steps

1. **Test locally** with `npm run dev`
2. **Verify auth flow** works end-to-end
3. **Test on mobile** browsers
4. **Deploy to Vercel** when ready
5. **Share with users**!

## 🎉 Features Overview

- **Magic Code Auth**: Email-based login, no passwords
- **Real-time Sync**: Changes sync instantly across devices
- **Offline Support**: Works offline, syncs when back online
- **Auto Migration**: Existing local data migrates seamlessly
- **User Profiles**: Profile dropdown with logout
- **Secure**: Database-level permissions, secure cookies

---

**Need help?** Check the InstantDB docs at [instantdb.com/docs](https://www.instantdb.com/docs)
