import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ProjectAdminClient from './project-admin-client';

export const dynamic = 'force-dynamic';

// Project Admin kontrolü
async function checkProjectAdmin() {
  const cookieStore = await cookies();
  const projectAdminCookie = cookieStore.get('project-admin');

  if (!projectAdminCookie || projectAdminCookie.value !== 'true') {
    return false;
  }

  return true;
}

export default async function ProjectAdminPage() {
  // Project admin kontrolü
  const isProjectAdmin = await checkProjectAdmin();

  if (!isProjectAdmin) {
    redirect('/');
  }

  return <ProjectAdminClient />;
}
