import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '@/providers/AppProvider';
import { queryClient } from '@/queryClient';
import { RootRedirect } from '@/router/RootRedirect';
import { RequireAuth } from '@/router/RequireAuth';
import WelcomeLanguage from '@/pages/WelcomeLanguage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import OrganizationSelectPage from '@/pages/OrganizationSelectPage';
import LearnLayout from '@/pages/learn/LearnLayout';
import LearnHomePage from '@/pages/learn/LearnHomePage';
import ProfilePage from '@/pages/learn/ProfilePage';
import LeaderboardPage from '@/pages/learn/LeaderboardPage';
import LevelPage from '@/pages/learn/LevelPage';
import TheoryLessonPage from '@/pages/learn/TheoryLessonPage';
import QrPage from '@/pages/learn/QrPage';
import ExamLivePage from '@/pages/learn/ExamLivePage';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/welcome" element={<WelcomeLanguage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<RequireAuth />}>
              <Route path="/organization" element={<OrganizationSelectPage />} />
              <Route path="/learn" element={<LearnLayout />}>
                <Route index element={<LearnHomePage />} />
                <Route path="rating" element={<LeaderboardPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="qr" element={<QrPage />} />
                <Route path="exam" element={<ExamLivePage />} />
                <Route path="level/:levelId" element={<LevelPage />} />
                <Route
                  path="level/:levelId/theory/:theoryId"
                  element={<TheoryLessonPage />}
                />
              </Route>
            </Route>
            <Route path="/" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </QueryClientProvider>
  );
}
