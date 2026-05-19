export type EmployeeInviteStatus = 'accepted' | 'pending' | 'not_sent';

export type EmployeeInviteFields = {
  inviteSentAt?: Date | string | null;
  inviteAcceptedAt?: Date | string | null;
};

export function getEmployeeInviteStatus(employee: EmployeeInviteFields): EmployeeInviteStatus {
  if (employee.inviteAcceptedAt) return 'accepted';
  if (employee.inviteSentAt) return 'pending';
  return 'not_sent';
}

export function inviteStatusLabel(status: EmployeeInviteStatus): string {
  switch (status) {
    case 'accepted':
      return 'Accepted';
    case 'pending':
      return 'Pending';
    case 'not_sent':
      return 'Not sent';
  }
}
