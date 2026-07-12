import { apiClient } from './apiClient';

// Fetch all necessary data for the Allocation page
export async function fetchAllocationState() {
  const [users, departments, assetsData, allocationsData] = await Promise.all([
    apiClient('/users'),
    apiClient('/departments'),
    apiClient('/assets'),
    apiClient('/allocation'),
  ]);

  // Handle pagination objects returned by backend if any
  const usersList = users.data?.users || users.users || [];
  const departmentsList = departments.data?.departments || departments.departments || [];
  const assets = assetsData.data?.assets || assetsData.assets || [];
  const allocations = allocationsData.data?.allocations || allocationsData.allocations || [];

  const activeAllocations = allocations.filter((a) => a.status === 'ACTIVE').map(a => ({
    ...a,
    holderName: a.employee?.name || 'Unknown',
    asset: a.asset
  }));
  
  const history = allocations
    .filter((a) => a.status === 'RETURNED' || a.status === 'TRANSFERRED')
    .map(a => ({
      ...a,
      holderName: a.employee?.name || 'Unknown',
      asset: a.asset
    }))
    .sort((a, b) => new Date(b.returnedDate || 0) - new Date(a.returnedDate || 0));

  return {
    users: usersList,
    departments: departmentsList,
    assets: assets,
    activeAllocations,
    history,
    transfers: [], // No transfer approval flow in backend
    overdue: [], // Requires expectedReturnAt logic which is not in backend schema
  };
}

export async function allocateAsset({ assetId, holderId, reason }) {
  const res = await apiClient('/allocation', {
    method: 'POST',
    body: { assetId, employeeId: holderId, reason }
  });
  return res.data?.allocation || res.allocation;
}

export async function requestTransfer({ allocationId, toHolderId, note }) {
  // Backend processes transfer immediately
  const res = await apiClient('/allocation/transfer', {
    method: 'POST',
    body: { allocationId, newEmployeeId: toHolderId, reason: note }
  });
  return res.data?.allocation || res.allocation;
}

export async function returnAsset({ allocationId, condition, notes }) {
  const res = await apiClient(`/allocation/${allocationId}/return`, {
    method: 'PATCH',
    body: { condition, notes }
  });
  return res.data?.allocation || res.allocation;
}
