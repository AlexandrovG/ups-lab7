import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import {pagesDemo,basePath} from "./config/runtime";
import { AppLayout } from "./components/AppLayout";
import { FeedPage } from "./pages/FeedPage";
import { GridPage } from "./pages/GridPage";
import { DetailPage } from "./pages/DetailPage";
import { AddPage } from "./pages/AddPage";
import { LoginPage } from "./pages/LoginPage";

import { ModeratorPage } from "./pages/ModeratorPage";
import {ForbiddenPage,NotFoundPage} from "./pages/ErrorPages";

function App() {
  // HashRouter avoids 404 on direct deep links in GitHub Pages.
  const Router = pagesDemo ? HashRouter : BrowserRouter;
  return (
    <Router basename={pagesDemo ? undefined : (basePath === '/' ? undefined : basePath)}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<FeedPage />} />
          <Route path="/grid" element={<GridPage />} />
          <Route path="/detail/:id" element={<DetailPage />} />
          <Route path="/add" element={<AddPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/moderator" element={pagesDemo?<ForbiddenPage/>:<ModeratorPage/>}/>
          <Route path="/403" element={<ForbiddenPage/>}/>
          <Route path="*" element={<NotFoundPage/>}/>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;