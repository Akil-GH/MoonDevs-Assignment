import React from 'react';

const AppToastComponent = () => {
  return (
    <div className="app_toast">
        position={{ vertical: "bottom", horizontal: "center" }}
        message={toastMsg}
        severity={toastSev}
    </div>
  );
};

export default AppToastComponent;
