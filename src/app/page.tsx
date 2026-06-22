'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import PracticeArea from '../components/practice/PracticeArea';
import DialogModal from '../components/modals/DialogModal';
import SettingsModal from '../components/modals/SettingsModal';
import DeleteConfirmModal from '../components/modals/DeleteConfirmModal';
import MobileLayout from '../components/layout/mobile/Layout';
import MobileDialogModal from '../components/modals/mobile/DialogModal';
import MobileSettingsModal from '../components/modals/mobile/SettingsModal';
import OnboardingModal from '../components/modals/OnboardingModal';
import AttendanceModal, { AttendanceReward } from '../components/modals/AttendanceModal';
import LeaderboardModal from '../components/modals/LeaderboardModal';
import Toast, { ToastMessage } from '../components/ui/Toast';
import MobileToast from '../components/ui/mobile/Toast';
import type { Dialogue, UserStats, Settings, PracticeLevel, DialogueLine } from '../types';
import {
  getDialogues,
  saveDialogue,
  getUserStats,
  saveUserStats,
  getSettings,
  saveSettings,
  softDeleteDialogue,
  getDeviceUuid,
  getLeaderboard,
  getAttendanceConfig
} from '../utils/supabase';
import { checkWeeklyLimit } from '../utils/security';

// Seed Dialogues
const SEED_DIALOGUES: Dialogue[] = [
  {
    id: 'seed-1',
    title: 'Gọi đồ uống tại quán cà phê',
    description: 'Học cách gọi nước uống, chọn size và yêu cầu thêm/bớt đá đường khi đi cà phê.',
    tags: ['giao-tiep', 'cafe', 'an-uong'],
    practiceCount: 0,
    createdAt: new Date().toISOString(),
    lines: [
      { id: 's1-l1', speaker: 'Barista', en: 'Hi there! What can I get started for you today?', vi: 'Xin chào! Tôi có thể chuẩn bị món gì cho bạn hôm nay?' },
      { id: 's1-l2', speaker: 'Customer', en: 'Hello. I would like a large iced latte with oat milk, please.', vi: 'Xin chào. Cho tôi một ly latte đá size lớn với sữa yến mạch nhé.' },
      { id: 's1-l3', speaker: 'Barista', en: 'Sure thing. Would you like that sweetened, or unsweetened?', vi: 'Được chứ ạ. Bạn muốn ngọt hay không ngọt?' },
      { id: 's1-l4', speaker: 'Customer', en: 'Just half sweet, please. And can I also get a chocolate croissant?', vi: 'Chỉ ngọt vừa thôi ạ. Và cho tôi một chiếc bánh sừng bò socola nữa nhé?' },
      { id: 's1-l5', speaker: 'Barista', en: 'You got it. That will be seven dollars and fifty cents. Cash or card?', vi: 'Nhất trí. Của bạn hết bảy đô la năm mươi xu. Thanh toán tiền mặt hay thẻ ạ?' },
      { id: 's1-l6', speaker: 'Customer', en: 'Card, please. Here you go.', vi: 'Thẻ ạ. Gửi bạn thẻ nhé.' },
      { id: 's1-l7', speaker: 'Barista', en: 'Thank you. Your order will be ready at the pick-up counter.', vi: 'Cảm ơn bạn. Đồ uống của bạn sẽ có tại quầy nhận đồ nhé.' }
    ]
  },
  {
    id: 'seed-2',
    title: 'Thủ tục ký gửi tại sân bay',
    description: 'Cuộc hội thoại giữa hành khách và nhân viên quầy check-in khi làm thủ tục bay.',
    tags: ['du-lich', 'san-bay', 'thu-tuc'],
    practiceCount: 0,
    createdAt: new Date().toISOString(),
    lines: [
      { id: 's2-l1', speaker: 'Agent', en: 'Good morning. Where are you flying to today?', vi: 'Chào buổi sáng. Hôm nay bạn bay đi đâu ạ?' },
      { id: 's2-l2', speaker: 'Passenger', en: 'Good morning. I am flying to London Heathrow.', vi: 'Chào buổi sáng. Tôi bay đi London Heathrow.' },
      { id: 's2-l3', speaker: 'Agent', en: 'May I have your passport and booking reference, please?', vi: 'Cho tôi xin hộ chiếu và mã đặt vé của bạn được không?' },
      { id: 's2-l4', speaker: 'Passenger', en: 'Yes, here is my passport, and the ticket is on my phone screen.', vi: 'Vâng, đây là hộ chiếu của tôi, còn vé máy bay ở trên màn hình điện thoại.' },
      { id: 's2-l5', speaker: 'Agent', en: 'Perfect. Are you checking any bags today?', vi: 'Tuyệt vời. Bạn có ký gửi hành lý nào hôm nay không?' },
      { id: 's2-l6', speaker: 'Passenger', en: 'Just this one suitcase, and I have a backpack as carry-on.', vi: 'Chỉ một chiếc vali này thôi, và tôi có một chiếc balo xách tay nữa.' },
      { id: 's2-l7', speaker: 'Agent', en: 'Great. Please place your suitcase on the scale. Here is your boarding pass.', vi: 'Tốt rồi. Hãy đặt vali lên cân nhé. Đây là thẻ lên máy bay của bạn.' }
    ]
  },
  {
    id: 'seed-3',
    title: 'Hỏi đường đến hiệu thuốc',
    description: 'Cách hỏi đường và chỉ đường khi bị lạc hoặc cần tìm địa điểm gấp.',
    tags: ['giao-tiep', 'hoi-duong', 'doi-song'],
    practiceCount: 0,
    createdAt: new Date().toISOString(),
    lines: [
      { id: 's3-l1', speaker: 'Tourist', en: 'Excuse me, could you tell me how to get to the nearest pharmacy?', vi: 'Xin lỗi, bạn có thể chỉ cho tôi đường đến hiệu thuốc gần nhất không?' },
      { id: 's3-l2', speaker: 'Local', en: 'Yes, of course. Go straight down this street for two blocks.', vi: 'Vâng, dĩ nhiên rồi. Hãy đi thẳng đường này khoảng hai ngã tư.' },
      { id: 's3-l3', speaker: 'Tourist', en: 'Should I turn left or right after that?', vi: 'Sau đó tôi nên rẽ trái hay rẽ phải?' },
      { id: 's3-l4', speaker: 'Local', en: 'Turn right at the traffic light. The pharmacy is right next to the bank.', vi: 'Rẽ phải ở đèn giao thông. Hiệu thuốc nằm ngay cạnh ngân hàng.' },
      { id: 's3-l5', speaker: 'Tourist', en: 'Is it within walking distance, or should I take a taxi?', vi: 'Đáp án đó có thể đi bộ được không, hay tôi nên bắt taxi?' },
      { id: 's3-l6', speaker: 'Local', en: 'It is very close, only about a five-minute walk from here.', vi: 'Rất gần thôi, chỉ khoảng năm phút đi bộ từ đây.' },
      { id: 's3-l7', speaker: 'Tourist', en: 'Awesome! Thank you so much for your help.', vi: 'Tuyệt quá! Cảm ơn bạn rất nhiều vì sự giúp đỡ.' },
      { id: 's3-l8', speaker: 'Local', en: 'You are welcome. Have a nice day!', vi: 'Không có gì đâu. Chúc bạn một ngày tốt lành!' }
    ]
  },
  {
    id: 'seed-4',
    title: 'Một buổi sáng trong lành',
    description: 'Đoạn văn ngắn tả cảnh buổi sáng thức dậy tràn đầy năng lượng với các mẫu câu đơn giản.',
    tags: ['doan-van', 'morning', 'daily'],
    type: 'paragraph',
    sentenceLength: 'short',
    practiceCount: 0,
    createdAt: new Date().toISOString(),
    lines: [
      { id: 's4-l1', speaker: 'Paragraph', en: 'I wake up early today.', vi: 'Hôm nay tôi thức dậy sớm.' },
      { id: 's4-l2', speaker: 'Paragraph', en: 'The sun is shining brightly.', vi: 'Mặt trời đang chiếu sáng rực rỡ.' },
      { id: 's4-l3', speaker: 'Paragraph', en: 'I drink a glass of warm water.', vi: 'Tôi uống một cốc nước ấm.' },
      { id: 's4-l4', speaker: 'Paragraph', en: 'I feel very happy and active.', vi: 'Tôi cảm thấy rất vui vẻ và năng động.' },
      { id: 's4-l5', speaker: 'Paragraph', en: 'A new beautiful day begins.', vi: 'Một ngày mới đẹp đẽ bắt đầu.' }
    ]
  }
];

// Initial Settings
const DEFAULT_SETTINGS: Settings = {
  geminiApiKey: '',
  voiceName: '',
  speechRate: 1.0,
  showConfidence: false,
};

// Initial Stats
const DEFAULT_STATS: UserStats = {
  streak: 0,
  totalXP: 0,
  incorrectWords: {},
};

// Fallback Attendance Rewards config
const DEFAULT_FALLBACK_REWARDS: AttendanceReward[] = [
  { dayOfWeek: 1, rewardType: 'multiplier', rewardValue: 2, rewardLabel: 'Nhân 2 kinh nghiệm (x2 XP)' },
  { dayOfWeek: 2, rewardType: 'creation', rewardValue: 1, rewardLabel: 'Thêm 1 lượt tạo bài học' },
  { dayOfWeek: 3, rewardType: 'xp', rewardValue: 50, rewardLabel: '+50 XP thưởng' },
  { dayOfWeek: 4, rewardType: 'creation', rewardValue: 2, rewardLabel: 'Thêm 2 lượt tạo bài học' },
  { dayOfWeek: 5, rewardType: 'xp', rewardValue: 100, rewardLabel: '+100 XP thưởng' },
  { dayOfWeek: 6, rewardType: 'multiplier', rewardValue: 3, rewardLabel: 'Nhân 3 kinh nghiệm (x3 XP)' },
  { dayOfWeek: 7, rewardType: 'creation', rewardValue: 3, rewardLabel: 'Thêm 3 lượt tạo bài học' },
];

export default function Home() {
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [userStats, setUserStats] = useState<UserStats>(DEFAULT_STATS);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isMobile, setIsMobile] = useState(false);

  // Onboarding, Attendance & Leaderboard states
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<UserStats[]>([]);
  const [attendanceRewards, setAttendanceRewards] = useState<AttendanceReward[]>([]);

  // Modal control states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dialogueToDelete, setDialogueToDelete] = useState<Dialogue | null>(null);

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toggle mobile mode HTML class for typography scaling
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isMobile) {
        document.documentElement.classList.add('mobile-mode');
      } else {
        document.documentElement.classList.remove('mobile-mode');
      }
    }
  }, [isMobile]);

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, description: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, title, description }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Hydration marker
  const [isMounted, setIsMounted] = useState(false);

  // Load from Supabase and handle viewport resize
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    
    // Viewport width detection
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Theme stays in localStorage as requested
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('shadowdictate_theme');
      if (storedTheme === 'dark' || storedTheme === 'light') {
        setTheme(storedTheme as 'dark' | 'light');
      }
    }

    async function initSupabaseData() {
      try {
        // 1. Fetch settings
        let currentS = await getSettings();
        if (!currentS) {
          await saveSettings(DEFAULT_SETTINGS);
          currentS = DEFAULT_SETTINGS;
        }
        setSettings(currentS);

        // 2. Fetch stats
        let currentStats = await getUserStats();
        if (!currentStats) {
          await saveUserStats(DEFAULT_STATS);
          currentStats = DEFAULT_STATS;
        }
        setUserStats(currentStats);

        // Auto-trigger onboarding if username is empty
        if (!currentStats.username) {
          setIsOnboardingOpen(true);
        }

        // 3. Fetch dialogues
        let currentDialogues = await getDialogues();
        if (currentDialogues.length === 0) {
          // Seed the database
          for (const d of SEED_DIALOGUES) {
            await saveDialogue(d);
          }
          currentDialogues = [...SEED_DIALOGUES];
        }
        setDialogues(currentDialogues);
        if (currentDialogues.length > 0) {
          setSelectedId(currentDialogues[0].id);
        }

        // 4. Fetch attendance config
        try {
          const config = await getAttendanceConfig();
          if (config && config.length === 7) {
            setAttendanceRewards(config);
          } else {
            setAttendanceRewards(DEFAULT_FALLBACK_REWARDS);
          }
        } catch (e) {
          console.error('Failed to load attendance config:', e);
          setAttendanceRewards(DEFAULT_FALLBACK_REWARDS);
        }

        // 5. Fetch leaderboard data
        try {
          const lb = await getLeaderboard();
          setLeaderboardData(lb);
        } catch (e) {
          console.error('Failed to load leaderboard data:', e);
        }
      } catch (err) {
        console.error('Không kết nối được Supabase, chuyển sang chế độ dự phòng.', err);
        // Fallback to local defaults if DB offline
        setSettings(DEFAULT_SETTINGS);
        setUserStats(DEFAULT_STATS);
        setDialogues(SEED_DIALOGUES);
        if (SEED_DIALOGUES.length > 0) {
          setSelectedId(SEED_DIALOGUES[0].id);
        }
      }
    }

    initSupabaseData();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleThemeToggle = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('shadowdictate_theme', nextTheme);
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        Đang tải cấu hình ứng dụng...
      </div>
    );
  }

  const selectedDialogue = dialogues.find(d => d.id === selectedId) || null;

  // Add dialogue handler
  const handleAddDialogue = async (newDialogue: Omit<Dialogue, 'id' | 'createdAt' | 'practiceCount'>) => {
    const additionalLimit = userStats.additionalCreations || 0;
    // Enforce limit of 50 + additionalCreations custom dialogues per week
    if (!checkWeeklyLimit(dialogues, additionalLimit)) {
      showToast(
        'error',
        'Giới hạn tạo bài học',
        `Bạn đã đạt giới hạn tự tạo tối đa ${50 + additionalLimit} bài học trong tuần này (bao gồm lượt thưởng). Hãy điểm danh để tích thêm lượt tạo nhé!`
      );
      return;
    }

    const deviceUuid = getDeviceUuid();
    const fullDialogue: Dialogue = {
      ...newDialogue,
      id: `dialogue-${deviceUuid}-${Date.now()}`,
      createdAt: new Date().toISOString(),
      practiceCount: 0,
    };

    const updated = [fullDialogue, ...dialogues];
    setDialogues(updated);
    setSelectedId(fullDialogue.id);

    try {
      await saveDialogue(fullDialogue);
    } catch (err) {
      console.error('Không thể lưu hội thoại mới lên Supabase:', err);
    }
  };

  // Delete dialogue handler
  const handleDeleteConfirm = async () => {
    if (!dialogueToDelete) return;

    const idToDelete = dialogueToDelete.id;
    const remainingDialogues = dialogues.filter(d => d.id !== idToDelete);
    setDialogues(remainingDialogues);

    if (selectedId === idToDelete) {
      if (remainingDialogues.length > 0) {
        setSelectedId(remainingDialogues[0].id);
      } else {
        setSelectedId(null);
      }
    }

    try {
      await softDeleteDialogue(idToDelete);
      showToast('success', 'Xóa hội thoại thành công', `Hội thoại "${dialogueToDelete.title}" đã được ẩn khỏi danh sách.`);
    } catch (err) {
      console.error('Không thể xóa hội thoại trên Supabase:', err);
      showToast('error', 'Lỗi khi xóa hội thoại', 'Đã có lỗi xảy ra hoặc Supabase chưa được thêm cột is_deleted.');
      
      // Rollback list state
      try {
        const currentDialogues = await getDialogues();
        setDialogues(currentDialogues);
        if (currentDialogues.length > 0 && !currentDialogues.some(d => d.id === selectedId)) {
          setSelectedId(currentDialogues[0].id);
        }
      } catch (reloadErr) {
        console.error('Failed to reload dialogues after deletion error', reloadErr);
      }
    } finally {
      setDialogueToDelete(null);
    }
  };

  // Save settings handler
  const handleSaveSettings = async (newSettings: Settings) => {
    setSettings(newSettings);
    try {
      await saveSettings(newSettings);
    } catch (err) {
      console.error('Không thể lưu cấu hình lên Supabase:', err);
    }
  };

  const handleOpenLeaderboard = async () => {
    setIsLeaderboardOpen(true);
    try {
      const data = await getLeaderboard();
      setLeaderboardData(data);
    } catch (e) {
      console.error('Failed to refresh leaderboard:', e);
    }
  };

  const handleOnboardingSave = async (profileData: {
    username: string;
    age: number;
    job: string;
    learningNeed: string;
    avatarUrl: string;
  }) => {
    const updatedStats: UserStats = {
      ...userStats,
      username: profileData.username,
      age: profileData.age,
      job: profileData.job,
      learningNeed: profileData.learningNeed,
      avatarUrl: profileData.avatarUrl,
    };
    
    setUserStats(updatedStats);
    setIsOnboardingOpen(false);
    
    try {
      await saveUserStats(updatedStats);
      showToast('success', 'Hồ sơ cá nhân đã lưu!', 'Chào mừng bạn đến với ShadowDictate.');
      // Refresh leaderboard to include new user
      const data = await getLeaderboard();
      setLeaderboardData(data);
    } catch (err) {
      console.error('Lỗi khi lưu hồ sơ onboarding:', err);
      showToast('error', 'Lỗi kết nối', 'Không thể lưu hồ sơ lên Supabase.');
    }
  };

  const handleCheckin = async (reward: AttendanceReward, randomXpBonus: number) => {
    const today = new Date();
    const todayStr = today.toLocaleDateString('sv');
    
    // 1. Calculate checkin streak
    let newCheckinStreak = userStats.checkinStreak || 0;
    const lastCheckin = userStats.lastCheckinDate ? new Date(userStats.lastCheckinDate) : null;
    
    if (!lastCheckin) {
      newCheckinStreak = 1;
    } else {
      const todayDateObj = new Date(todayStr);
      lastCheckin.setHours(0, 0, 0, 0);
      todayDateObj.setHours(0, 0, 0, 0);
      const diffTime = todayDateObj.getTime() - lastCheckin.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        newCheckinStreak += 1;
      } else if (diffDays > 1) {
        newCheckinStreak = 1;
      }
    }
    
    // 2. Calculate checkin history (Mon-Sun of current week)
    const getMonday = (d: Date) => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(date.setDate(diff));
      mon.setHours(0, 0, 0, 0);
      return mon;
    };
    
    const currentMonday = getMonday(new Date());
    let newCheckinHistory = userStats.checkinHistory || [];
    if (lastCheckin && new Date(userStats.lastCheckinDate!) < currentMonday) {
      newCheckinHistory = [];
    }
    
    let dayOfWeek = today.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7;
    if (!newCheckinHistory.includes(dayOfWeek)) {
      newCheckinHistory = [...newCheckinHistory, dayOfWeek];
    }
    
    // 3. Process rewards
    let xpGift = randomXpBonus;
    let creationGift = 0;
    
    if (reward.rewardType === 'xp') {
      xpGift += reward.rewardValue;
    } else if (reward.rewardType === 'creation') {
      creationGift = reward.rewardValue;
    } else if (reward.rewardType === 'multiplier') {
      // Award extra fixed XP for multiplier check-in day, plus multiplier is applied to practice XP
      xpGift += reward.rewardValue * 25;
    }
    
    const updatedStats: UserStats = {
      ...userStats,
      lastCheckinDate: todayStr,
      checkinStreak: newCheckinStreak,
      checkinHistory: newCheckinHistory,
      totalXP: userStats.totalXP + xpGift,
      additionalCreations: (userStats.additionalCreations || 0) + creationGift,
    };
    
    setUserStats(updatedStats);
    
    try {
      await saveUserStats(updatedStats);
      showToast('success', 'Điểm danh thành công!', `Bạn nhận được ${xpGift} XP ${creationGift > 0 ? `và +${creationGift} lượt tạo` : ''}.`);
      
      // Refresh leaderboard
      const data = await getLeaderboard();
      setLeaderboardData(data);
    } catch (err) {
      console.error('Lỗi khi lưu điểm danh:', err);
      showToast('error', 'Lỗi hệ thống', 'Không thể cập nhật thông tin điểm danh.');
    }
  };

  // Update stats & Spaced Repetition on practice complete
  const handlePracticeComplete = async (score: number, level: PracticeLevel, updatedLines: DialogueLine[]) => {
    if (!selectedId) return;

    // 1. Calculate spaced repetition review date
    const reviewInDays = score >= 90 ? 3 : score >= 70 ? 1 : 0;
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + reviewInDays);

    // 2. Update dialogue info
    let targetDialogue: Dialogue | null = null;
    const updatedDialogues = dialogues.map(d => {
      if (d.id === selectedId) {
        // Calculate level scores dynamically from updatedLines
        const levels: PracticeLevel[] = ['shadow', 'copy', 'type', 'listen', 'ai_chat'];
        const levelScores: Record<PracticeLevel, number> = {
          shadow: 0,
          copy: 0,
          type: 0,
          listen: 0,
          ai_chat: 0
        };
        levels.forEach(lvl => {
          let total = 0;
          updatedLines.forEach(line => {
            if (line.scores && line.scores[lvl] !== undefined) {
              total += line.scores[lvl]!;
            }
          });
          levelScores[lvl] = updatedLines.length > 0 ? Math.round(total / updatedLines.length) : 0;
        });

        // Overall score is average of the 5 levels
        const overallScore = Math.round(
          (levelScores.shadow + levelScores.copy + levelScores.type + levelScores.listen + levelScores.ai_chat) / 5
        );

        const updated = {
          ...d,
          lines: updatedLines,
          practiceCount: d.practiceCount + 1,
          lastScore: overallScore, // new overall dialogue score
          levelScores: levelScores,
          level: level,
          lastPracticed: new Date().toISOString(),
          spacedRepetitionDate: reviewDate.toISOString(),
        };
        targetDialogue = updated;
        return updated;
      }
      return d;
    });

    setDialogues(updatedDialogues);

    if (targetDialogue) {
      try {
        await saveDialogue(targetDialogue);
      } catch (err) {
        console.error('Không thể cập nhật tiến trình hội thoại lên Supabase:', err);
      }
    }

    // 3. Update Streak & XP with Multiplier support
    const todayStr = new Date().toLocaleDateString('sv'); // YYYY-MM-DD format
    let newStreak = userStats.streak;

    if (!userStats.lastActiveDate) {
      newStreak = 1;
    } else {
      const lastActive = new Date(userStats.lastActiveDate);
      const todayObj = new Date(todayStr);
      const diffTime = todayObj.getTime() - lastActive.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    }

    // Check check-in multiplier for today
    const today = new Date();
    let dayOfWeek = today.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7;
    const todayReward = attendanceRewards.find(r => r.dayOfWeek === dayOfWeek);
    let activeMultiplier = 1;
    if (
      todayReward &&
      todayReward.rewardType === 'multiplier' &&
      userStats.lastCheckinDate === todayStr
    ) {
      activeMultiplier = todayReward.rewardValue;
    }

    const baseXp = Math.round(score * 1.5);
    const xpEarned = baseXp * activeMultiplier;
    const updatedStats: UserStats = {
      ...userStats,
      streak: newStreak,
      totalXP: userStats.totalXP + xpEarned,
      lastActiveDate: todayStr,
    };

    setUserStats(updatedStats);
    try {
      await saveUserStats(updatedStats);
      // Refresh leaderboard after earning XP
      const lb = await getLeaderboard();
      setLeaderboardData(lb);
    } catch (err) {
      console.error('Không thể cập nhật chỉ số lên Supabase:', err);
    }

    // 4. Send detailed Toast notification about success/failure and completion details
    if (targetDialogue) {
      const dialogueObj = targetDialogue as Dialogue;
      const levelName = {
        shadow: 'Shadowing',
        copy: 'Copy Type',
        type: 'Dictation',
        listen: 'Listening',
        ai_chat: 'AI Roleplay',
      }[level];

      const completedCount = updatedLines.filter(
        line => line.scores && line.scores[level] !== undefined && line.scores[level]! > 0
      ).length;
      const totalCount = updatedLines.length;
      const skippedCount = totalCount - completedCount;

      const previousOverall = (dialogues.find(d => d.id === selectedId)?.lastScore) || 0;
      const newOverall = dialogueObj.lastScore || 0;
      const diff = newOverall - previousOverall;

      const toastType = skippedCount > 0 ? 'warning' : score >= 80 ? 'success' : 'info';
      const toastTitle = skippedCount > 0 
        ? `Xác nhận: ${levelName} (Chưa hoàn thành hết)`
        : `Hoàn thành ${levelName} thành công!`;

      let toastDesc = `Hoàn thành ${completedCount}/${totalCount} câu. Điểm phần này: ${score}%.`;
      if (skippedCount > 0) {
        toastDesc += ` (${skippedCount} câu chưa luyện).`;
      }
      toastDesc += ` Độ thành thạo hội thoại: ${newOverall}%${diff > 0 ? ` (+${diff}%)` : ''}.`;
      if (activeMultiplier > 1) {
        toastDesc += ` Nhận x${activeMultiplier} XP (${xpEarned} XP!).`;
      } else {
        toastDesc += ` Nhận ${xpEarned} XP.`;
      }

      showToast(toastType, toastTitle, toastDesc);
    }
  };

  if (isMobile) {
    return (
      <div className={`flex h-screen w-screen overflow-hidden font-sans antialiased transition-colors duration-200 ${
        theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-white text-zinc-900'
      }`}>
        <MobileLayout
          dialogues={dialogues}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAddClick={() => setIsAddOpen(true)}
          onSettingsClick={() => setIsSettingsOpen(true)}
          userStats={userStats}
          theme={theme}
          onThemeToggle={handleThemeToggle}
          onDeleteClick={setDialogueToDelete}
          settings={settings}
          onPracticeComplete={handlePracticeComplete}
          showToast={showToast}
          onAttendanceClick={() => setIsAttendanceOpen(true)}
          onLeaderboardClick={handleOpenLeaderboard}
        />

        {/* Add Dialogue Modal */}
        <MobileDialogModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onSave={handleAddDialogue}
          geminiApiKey={settings.geminiApiKey}
          theme={theme}
        />

        {/* Settings Modal */}
        <MobileSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveSettings}
          currentSettings={settings}
          theme={theme}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={!!dialogueToDelete}
          onClose={() => setDialogueToDelete(null)}
          onConfirm={handleDeleteConfirm}
          dialogueTitle={dialogueToDelete?.title || ''}
          theme={theme}
        />

        {/* Toast notifications container */}
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none w-full max-w-sm">
          {toasts.map(toast => (
            <MobileToast key={toast.id} toast={toast} onClose={removeToast} theme={theme} />
          ))}
        </div>

        {/* Onboarding Modal */}
        <OnboardingModal
          isOpen={isOnboardingOpen}
          onSave={handleOnboardingSave}
          theme={theme}
        />

        {/* Attendance Modal */}
        <AttendanceModal
          isOpen={isAttendanceOpen}
          onClose={() => setIsAttendanceOpen(false)}
          userStats={userStats}
          rewardsConfig={attendanceRewards}
          onCheckin={handleCheckin}
          theme={theme}
        />

        {/* Leaderboard Modal */}
        <LeaderboardModal
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
          leaderboardData={leaderboardData}
          currentUserStats={userStats}
          currentUserStatsId={`stats_${getDeviceUuid()}`}
          theme={theme}
        />
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans antialiased transition-colors duration-200 ${
      theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-white text-zinc-900'
    }`}>
      {/* 2-Column Application Layout */}
      <Sidebar
        dialogues={dialogues}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAddClick={() => setIsAddOpen(true)}
        onSettingsClick={() => setIsSettingsOpen(true)}
        userStats={userStats}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onDeleteClick={setDialogueToDelete}
        onAttendanceClick={() => setIsAttendanceOpen(true)}
        onLeaderboardClick={handleOpenLeaderboard}
      />

      <PracticeArea
        dialogue={selectedDialogue}
        settings={settings}
        onPracticeComplete={handlePracticeComplete}
        theme={theme}
        showToast={showToast}
      />

      {/* Add Dialogue Modal */}
      <DialogModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleAddDialogue}
        geminiApiKey={settings.geminiApiKey}
        theme={theme}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        currentSettings={settings}
        theme={theme}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!dialogueToDelete}
        onClose={() => setDialogueToDelete(null)}
        onConfirm={handleDeleteConfirm}
        dialogueTitle={dialogueToDelete?.title || ''}
        theme={theme}
      />

      {/* Toast notifications container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none w-full max-w-sm">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onClose={removeToast} theme={theme} />
        ))}
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onSave={handleOnboardingSave}
        theme={theme}
      />

      {/* Attendance Modal */}
      <AttendanceModal
        isOpen={isAttendanceOpen}
        onClose={() => setIsAttendanceOpen(false)}
        userStats={userStats}
        rewardsConfig={attendanceRewards}
        onCheckin={handleCheckin}
        theme={theme}
      />

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        leaderboardData={leaderboardData}
        currentUserStats={userStats}
        currentUserStatsId={`stats_${getDeviceUuid()}`}
        theme={theme}
      />
    </div>
  );
}
