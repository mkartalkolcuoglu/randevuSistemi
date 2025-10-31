# Vercel Environment Variables Setup

## Web App (netrandevu.com)
1. Go to https://vercel.com/dashboard
2. Select "web" project
3. Go to Settings > Environment Variables
4. Add:
   - Key: `PROJECT_ADMIN_URL`
   - Value: `https://yonetim.netrandevu.com`
   - Environment: Production, Preview, Development

## Admin App (admin.netrandevu.com)
Already configured

## Project-Admin App (yonetim.netrandevu.com)
Already configured with DATABASE_URL

After adding environment variables:
- Redeploy the project
- Variables will be available in build and runtime
