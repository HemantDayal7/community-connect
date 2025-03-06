import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Welcome to the Community Connect Dashboard</p>
      <Link to="/profile" className="text-blue-500">Go to Profile</Link>
    </div>
  );
};

export default Dashboard;
