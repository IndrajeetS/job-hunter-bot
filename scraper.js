export async function fetchAllJobs() {
  const remoteok = await fetchRemoteOK();
  const remotive = await fetchRemotive();
  return [...remoteok, ...remotive];
}
