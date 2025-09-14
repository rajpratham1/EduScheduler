import React from 'react';
import './PendingApprovalPage.css';

function PendingApprovalPage() {
  return (
    <div className="pending-page">
      <div className="pending-container">
        <h1>Registration Submitted</h1>
        <p>Your account registration has been received and is currently awaiting approval from an administrator.</p>
        <p>You will be able to log in once your account has been approved.</p>
      </div>
    </div>
  );
}

export default PendingApprovalPage;
