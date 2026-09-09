import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import CustomerDashboard from "./pages/CustomerDashboard";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/customer"
          element={<CustomerDashboard />}
        />

        <Route
          path="/agent"
          element={<h1>Agent Dashboard - Coming Next</h1>}
        />

        <Route
          path="/manager"
          element={<h1>Manager Dashboard - Coming Next</h1>}
        />

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;