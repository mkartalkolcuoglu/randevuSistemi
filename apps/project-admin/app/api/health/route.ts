import { NextResponse } from 'next/server';

export async function GET() {
  const commitHash = process.env.VERCEL_GIT_COMMIT_SHA || 'local-dev';
  const deploymentId = process.env.VERCEL_DEPLOYMENT_ID || 'local';
  
  return NextResponse.json({
    status: 'ok',
    app: 'project-admin',
    commit: commitHash,
    deployment: deploymentId,
    timestamp: new Date().toISOString(),
    loginPageExists: true,
    message: 'Project Admin is running'
  });
}

