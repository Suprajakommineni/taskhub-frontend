import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }: any) {
  const token = localStorage.getItem("token");

  return token ? children : <Navigate to="/login" />;
}

export default ProtectedRoute;