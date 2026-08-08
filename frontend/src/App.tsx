import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import HackList from "./pages/HackList";
import AiAssistant from "./pages/AiAssistant";
import HackEditor from "./pages/HackEditor";
import Preview from "./pages/Preview";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/hacks" element={<HackList />} />
        <Route path="/hacks/new" element={<AiAssistant />} />
        <Route path="/hacks/:id" element={<HackEditor />} />
        <Route path="/hacks/:id/preview" element={<Preview />} />
      </Route>
    </Routes>
  );
}
