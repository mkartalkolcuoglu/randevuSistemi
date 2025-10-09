import { NextResponse } from 'next/server';

export async function GET() {
  const gitCommit = process.env.VERCEL_GIT_COMMIT_SHA || 'unknown';
  const deploymentDate = new Date().toISOString();
  
  return NextResponse.json({
    status: 'ok',
    timestamp: deploymentDate,
    git_commit: gitCommit.substring(0, 7),
    git_commit_full: gitCommit,
    message: 'Admin API is healthy',
    prisma_fix_applied: 'find-then-create',
    version: '2.0.0'
  });
}

