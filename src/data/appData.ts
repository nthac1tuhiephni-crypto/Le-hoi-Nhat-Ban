export type ScreenId =
  | 'TRANG-BIA'
  | 'PHAN-1'
  | 'HOA-ANH-DAO'
  | 'BUP-BE'
  | 'TET-THIEU-NHI'
  | 'LE-HOI-KHAC'
  | 'PHAN-2'
  | 'PHAN-3'
  | 'HOAN-THANH';

export type ImageScreenKey =
  | 'TRANG-BIA'
  | 'PHAN-1'
  | 'HOA-ANH-DAO'
  | 'BUP-BE'
  | 'TET-THIEU-NHI'
  | 'LE-HOI-KHAC';

export type AudioSlotKey =
  | 'hoa-anh-dao-vi'
  | 'hoa-anh-dao-en'
  | 'bup-be-vi'
  | 'bup-be-en'
  | 'tet-thieu-nhi-vi'
  | 'tet-thieu-nhi-en';

export interface HotspotConfig {
  id: string;
  label: string;
  left: number; // percentage 0-100
  top: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  actionType: 'navigate' | 'audio' | 'finish-explore';
  targetScreen?: ScreenId;
  audioSlot?: AudioSlotKey;
  audioUrl?: string;
  audioLang?: 'vi' | 'en';
  audioText?: string;
}

export const FESTIVAL_TEXTS = {
  'HOA-ANH-DAO': {
    title: 'Lễ hội Hoa anh đào',
    vi: 'Lễ hội Hoa anh đào được xem là lễ hội lớn, lâu đời nhất tại Nhật Bản. Hằng năm, vào mùa xuân, hoa anh đào trên cả nước bắt đầu nở rộ. Mọi người ngồi dưới gốc anh đào ngắm hoa, cùng liên hoan, cùng hát hò, nhảy múa,... Đất nước Nhật Bản rất tự hào khi được mệnh danh là “xứ sở hoa anh đào”.',
    en: 'The Cherry Blossom Festival is considered the largest and oldest festival in Japan. Every year in spring, cherry blossoms bloom all across the country. People sit under the cherry blossom trees to admire the flowers, have parties, sing, and dance together. Japan is very proud to be known as the Land of Cherry Blossoms.',
  },
  'BUP-BE': {
    title: 'Lễ hội Búp bê',
    vi: 'Lễ hội Búp bê (ngày 03 tháng 3) là ngày để các gia đình Nhật Bản cầu may mắn và sức khoẻ cho các bé gái. Vào ngày này, người ta trưng bày nhiều búp bê Hi-na trong căn phòng đẹp nhất của gia đình. Họ quây quần bên nhau, ăn cơm đậu đỏ, bánh hi-si-mô-chi.',
    en: 'The Doll Festival, on March 3rd, is a day for Japanese families to pray for good luck and health for young girls. On this day, people display Hina dolls in the finest room of the family home. They gather together and eat red bean rice and hishimochi rice cakes.',
  },
  'TET-THIEU-NHI': {
    title: 'Tết Thiếu nhi',
    vi: 'Tết Thiếu nhi (ngày 05 tháng 5) đã trở thành ngày nghỉ lễ toàn quốc của người dân Nhật Bản. Thực ra, tết Thiếu nhi chỉ dành cho các bé trai. Trên nóc nhà, mỗi gia đình thường treo những dải cờ hình cá chép sặc sỡ, nhiều màu để thể hiện ước mong về sức khoẻ và sự thành công cho các bé.',
    en: "Children's Day, on May 5th, has become a national holiday for the people of Japan. Originally, Children's Day was specifically for boys. On the rooftops, each family hangs colorful carp-shaped streamers to express their wishes for the children's health and success.",
  },
};

export const SCREEN_HOTSPOTS: Record<ImageScreenKey, HotspotConfig[]> = {
  'TRANG-BIA': [
    {
      id: 'cover-to-phan1',
      label: 'Du hành lễ hội Nhật Bản',
      left: 4.0,
      top: 64.0,
      width: 30.0,
      height: 31.8,
      actionType: 'navigate',
      targetScreen: 'PHAN-1',
    },
    {
      id: 'cover-to-phan2',
      label: 'Thẻ từ vựng thông minh',
      left: 35.0,
      top: 63.5,
      width: 30.0,
      height: 32.3,
      actionType: 'navigate',
      targetScreen: 'PHAN-2',
    },
    {
      id: 'cover-to-phan3',
      label: 'Thử tài nhà khám phá',
      left: 66.0,
      top: 64.0,
      width: 30.0,
      height: 31.8,
      actionType: 'navigate',
      targetScreen: 'PHAN-3',
    },
  ],
  'PHAN-1': [
    {
      id: 'map-home',
      label: 'Trang chủ',
      left: 0.8,
      top: 1.8,
      width: 17.5,
      height: 9.8,
      actionType: 'navigate',
      targetScreen: 'TRANG-BIA',
    },
    {
      id: 'map-to-phan2',
      label: 'Sang thẻ từ vựng thông minh',
      left: 77.6,
      top: 1.8,
      width: 21.8,
      height: 12.2,
      actionType: 'navigate',
      targetScreen: 'PHAN-2',
    },
    {
      id: 'map-point-1-hoa-anh-dao',
      label: '1. Lễ hội Hoa anh đào',
      left: 5.5,
      top: 33.5,
      width: 27.0,
      height: 41.0,
      actionType: 'navigate',
      targetScreen: 'HOA-ANH-DAO',
    },
    {
      id: 'map-point-2-bup-be',
      label: '2. Lễ hội Búp bê',
      left: 39.2,
      top: 31.0,
      width: 26.0,
      height: 31.0,
      actionType: 'navigate',
      targetScreen: 'BUP-BE',
    },
    {
      id: 'map-point-3-tet-thieu-nhi',
      label: '3. Tết Thiếu nhi',
      left: 69.2,
      top: 30.5,
      width: 29.8,
      height: 41.0,
      actionType: 'navigate',
      targetScreen: 'TET-THIEU-NHI',
    },
    {
      id: 'map-point-4-le-hoi-khac',
      label: '4. Những lễ hội thú vị khác',
      left: 50.2,
      top: 71.5,
      width: 48.8,
      height: 27.0,
      actionType: 'navigate',
      targetScreen: 'LE-HOI-KHAC',
    },
  ],
  'HOA-ANH-DAO': [
    {
      id: 'had-home',
      label: 'Trang chủ',
      left: 0.8,
      top: 1.8,
      width: 17.5,
      height: 9.8,
      actionType: 'navigate',
      targetScreen: 'TRANG-BIA',
    },
    {
      id: 'had-back-map',
      label: 'Quay lại bản đồ',
      left: 81.8,
      top: 1.8,
      width: 17.5,
      height: 9.8,
      actionType: 'navigate',
      targetScreen: 'PHAN-1',
    },
    {
      id: 'had-prev',
      label: 'Lễ hội trước (Quay lại bản đồ)',
      left: 0.8,
      top: 86.8,
      width: 16.0,
      height: 9.0,
      actionType: 'navigate',
      targetScreen: 'PHAN-1',
    },
    {
      id: 'had-audio-vi',
      label: 'Nghe tiếng Việt',
      left: 28.0,
      top: 86.8,
      width: 22.0,
      height: 10.4,
      actionType: 'audio',
      audioSlot: 'hoa-anh-dao-vi',
      audioLang: 'vi',
      audioText: FESTIVAL_TEXTS['HOA-ANH-DAO'].vi,
    },
    {
      id: 'had-audio-en',
      label: 'Listen in English',
      left: 50.8,
      top: 86.8,
      width: 22.0,
      height: 10.4,
      actionType: 'audio',
      audioSlot: 'hoa-anh-dao-en',
      audioLang: 'en',
      audioText: FESTIVAL_TEXTS['HOA-ANH-DAO'].en,
    },
    {
      id: 'had-next',
      label: 'Lễ hội tiếp theo',
      left: 81.5,
      top: 86.8,
      width: 17.7,
      height: 9.0,
      actionType: 'navigate',
      targetScreen: 'BUP-BE',
    },
  ],
  'BUP-BE': [
    {
      id: 'bb-home',
      label: 'Trang chủ',
      left: 0.8,
      top: 1.8,
      width: 17.5,
      height: 9.8,
      actionType: 'navigate',
      targetScreen: 'TRANG-BIA',
    },
    {
      id: 'bb-back-map',
      label: 'Quay lại bản đồ',
      left: 81.8,
      top: 1.8,
      width: 17.5,
      height: 9.8,
      actionType: 'navigate',
      targetScreen: 'PHAN-1',
    },
    {
      id: 'bb-prev',
      label: 'Lễ hội trước',
      left: 0.8,
      top: 86.8,
      width: 16.0,
      height: 9.0,
      actionType: 'navigate',
      targetScreen: 'HOA-ANH-DAO',
    },
    {
      id: 'bb-audio-vi',
      label: 'Nghe tiếng Việt',
      left: 28.0,
      top: 86.8,
      width: 22.0,
      height: 10.4,
      actionType: 'audio',
      audioSlot: 'bup-be-vi',
      audioLang: 'vi',
      audioText: FESTIVAL_TEXTS['BUP-BE'].vi,
    },
    {
      id: 'bb-audio-en',
      label: 'Listen in English',
      left: 50.8,
      top: 86.8,
      width: 22.0,
      height: 10.4,
      actionType: 'audio',
      audioSlot: 'bup-be-en',
      audioLang: 'en',
      audioText: FESTIVAL_TEXTS['BUP-BE'].en,
    },
    {
      id: 'bb-next',
      label: 'Lễ hội tiếp theo',
      left: 81.5,
      top: 86.8,
      width: 17.7,
      height: 9.0,
      actionType: 'navigate',
      targetScreen: 'TET-THIEU-NHI',
    },
  ],
  'TET-THIEU-NHI': [
    {
      id: 'ttn-home',
      label: 'Trang chủ',
      left: 0.8,
      top: 1.8,
      width: 17.5,
      height: 9.8,
      actionType: 'navigate',
      targetScreen: 'TRANG-BIA',
    },
    {
      id: 'ttn-back-map',
      label: 'Quay lại bản đồ',
      left: 81.8,
      top: 1.8,
      width: 17.5,
      height: 9.8,
      actionType: 'navigate',
      targetScreen: 'PHAN-1',
    },
    {
      id: 'ttn-prev',
      label: 'Lễ hội trước',
      left: 0.8,
      top: 86.8,
      width: 16.0,
      height: 9.0,
      actionType: 'navigate',
      targetScreen: 'BUP-BE',
    },
    {
      id: 'ttn-audio-vi',
      label: 'Nghe tiếng Việt',
      left: 28.0,
      top: 86.8,
      width: 22.0,
      height: 10.4,
      actionType: 'audio',
      audioSlot: 'tet-thieu-nhi-vi',
      audioLang: 'vi',
      audioText: FESTIVAL_TEXTS['TET-THIEU-NHI'].vi,
    },
    {
      id: 'ttn-audio-en',
      label: 'Listen in English',
      left: 50.8,
      top: 86.8,
      width: 22.0,
      height: 10.4,
      actionType: 'audio',
      audioSlot: 'tet-thieu-nhi-en',
      audioLang: 'en',
      audioText: FESTIVAL_TEXTS['TET-THIEU-NHI'].en,
    },
    {
      id: 'ttn-next',
      label: 'Lễ hội tiếp theo',
      left: 81.5,
      top: 86.8,
      width: 17.7,
      height: 9.0,
      actionType: 'navigate',
      targetScreen: 'LE-HOI-KHAC',
    },
  ],
  'LE-HOI-KHAC': [
    {
      id: 'lhk-home',
      label: 'Trang chủ',
      left: 0.8,
      top: 1.8,
      width: 17.5,
      height: 9.8,
      actionType: 'navigate',
      targetScreen: 'TRANG-BIA',
    },
    {
      id: 'lhk-back-map',
      label: 'Quay lại bản đồ',
      left: 79.8,
      top: 1.8,
      width: 19.2,
      height: 10.2,
      actionType: 'navigate',
      targetScreen: 'PHAN-1',
    },
    {
      id: 'lhk-card-tanabata',
      label: 'Lễ hội Ngôi sao (Tanabata)',
      left: 3.0,
      top: 21.0,
      width: 30.0,
      height: 66.0,
      actionType: 'audio',
      audioUrl: '/audio/Tanabata.wav',
      audioText: 'Lễ hội Ngôi sao Tanabata',
      audioLang: 'vi',
    },
    {
      id: 'lhk-card-obon',
      label: 'Lễ hội Obon',
      left: 35.0,
      top: 21.0,
      width: 30.0,
      height: 66.0,
      actionType: 'audio',
      audioUrl: '/audio/obon.wav',
      audioText: 'Lễ hội Obon',
      audioLang: 'vi',
    },
    {
      id: 'lhk-card-sapporo',
      label: 'Lễ hội Tuyết Sapporo',
      left: 67.0,
      top: 21.0,
      width: 30.0,
      height: 66.0,
      actionType: 'audio',
      audioUrl: '/audio/Sapporo-moi.wav',
      audioText: 'Lễ hội Tuyết Sapporo',
      audioLang: 'vi',
    },
    {
      id: 'lhk-prev',
      label: 'Lễ hội trước',
      left: 1.2,
      top: 89.0,
      width: 17.5,
      height: 8.8,
      actionType: 'navigate',
      targetScreen: 'TET-THIEU-NHI',
    },
    {
      id: 'lhk-finish',
      label: 'Kết thúc khám phá',
      left: 76.2,
      top: 89.0,
      width: 22.5,
      height: 8.8,
      actionType: 'finish-explore',
      targetScreen: 'PHAN-1',
    },
  ],
};

export interface VocabItem {
  id: string;
  english: string;
  vietnamese: string;
  phonetic: string;
  image: string;
  exampleEn: string;
  exampleVi: string;
  accentColor: string;
}

export const VOCABULARY_CARDS: VocabItem[] = [
  {
    id: 'vocab-1',
    english: 'festival',
    vietnamese: 'lễ hội',
    phonetic: '/ˈfes.tɪ.vəl/',
    image: '/src/assets/images/vocab_festival_1791364948558.jpg',
    exampleEn: 'Japan has many traditional festivals.',
    exampleVi: 'Nhật Bản có nhiều lễ hội truyền thống.',
    accentColor: 'from-rose-500 to-pink-500',
  },
  {
    id: 'vocab-2',
    english: 'cherry blossom',
    vietnamese: 'hoa anh đào',
    phonetic: '/ˈtʃer.i ˈblɒs.əm/',
    image: '/src/assets/images/vocab_cherry_blossom_1791364959737.jpg',
    exampleEn: 'Cherry blossoms bloom in spring.',
    exampleVi: 'Hoa anh đào nở rộ vào mùa xuân.',
    accentColor: 'from-pink-500 to-fuchsia-500',
  },
  {
    id: 'vocab-3',
    english: 'doll',
    vietnamese: 'búp bê',
    phonetic: '/dɒl/',
    image: '/src/assets/images/vocab_doll_1791364972586.jpg',
    exampleEn: 'Families display Hina dolls on March 3rd.',
    exampleVi: 'Các gia đình trưng bày búp bê Hi-na vào ngày 3 tháng 3.',
    accentColor: 'from-amber-500 to-orange-500',
  },
  {
    id: 'vocab-4',
    english: 'kimono',
    vietnamese: 'trang phục kimono',
    phonetic: '/kɪˈməʊ.nəʊ/',
    image: '/src/assets/images/vocab_kimono_1791364983791.jpg',
    exampleEn: 'The children wear colorful kimonos.',
    exampleVi: 'Các bạn nhỏ mặc trang phục kimono rực rỡ.',
    accentColor: 'from-indigo-500 to-blue-500',
  },
  {
    id: 'vocab-5',
    english: 'carp streamer',
    vietnamese: 'cờ cá chép',
    phonetic: '/kɑːp ˈstriː.mər/',
    image: '/src/assets/images/vocab_carp_streamer_1791364994117.jpg',
    exampleEn: 'Colorful carp streamers fly on the rooftops.',
    exampleVi: 'Những dải cờ cá chép nhiều màu tung bay trên nóc nhà.',
    accentColor: 'from-sky-500 to-cyan-500',
  },
  {
    id: 'vocab-6',
    english: 'Japan',
    vietnamese: 'Nhật Bản',
    phonetic: '/dʒəˈpæn/',
    image: '/src/assets/images/vocab_japan_1791365005206.jpg',
    exampleEn: 'Japan is known as the Land of Cherry Blossoms.',
    exampleVi: 'Nhật Bản được mệnh danh là xứ sở hoa anh đào.',
    accentColor: 'from-red-500 to-rose-600',
  },
];

export const Q1_CHOICES = [
  {
    id: 'hoa-anh-dao',
    title: 'Lễ hội Hoa anh đào',
    subtitle: 'Mùa xuân hoa nở rộ khắp đất nước',
    image: '/src/assets/images/vocab_cherry_blossom_1791364959737.jpg',
    isCorrect: true,
  },
  {
    id: 'bup-be',
    title: 'Lễ hội Búp bê',
    subtitle: 'Ngày 03 tháng 3 dành cho các bé gái',
    image: '/src/assets/images/vocab_doll_1791364972586.jpg',
    isCorrect: false,
  },
  {
    id: 'tet-thieu-nhi',
    title: 'Tết Thiếu nhi',
    subtitle: 'Ngày 05 tháng 5 treo cờ cá chép',
    image: '/src/assets/images/vocab_carp_streamer_1791364994117.jpg',
    isCorrect: false,
  },
];

export const Q2_ACTIVITIES = [
  {
    id: 'act-1',
    text: 'Ngồi dưới gốc anh đào ngắm hoa.',
    emoji: '🌸',
    isCorrect: true,
  },
  {
    id: 'act-2',
    text: 'Cùng liên hoan.',
    emoji: '🍱',
    isCorrect: true,
  },
  {
    id: 'act-3',
    text: 'Trưng bày nhiều búp bê Hi-na trong căn phòng đẹp nhất.',
    emoji: '🎎',
    isCorrect: false,
  },
  {
    id: 'act-4',
    text: 'Cùng hát hò.',
    emoji: '🎤',
    isCorrect: true,
  },
  {
    id: 'act-5',
    text: 'Nhảy múa.',
    emoji: '💃',
    isCorrect: true,
  },
  {
    id: 'act-6',
    text: 'Treo những dải cờ hình cá chép sặc sỡ trên nóc nhà.',
    emoji: '🎏',
    isCorrect: false,
  },
];

export interface Q3ComparisonCard {
  id: string;
  text: string;
  targetFestival: 'BUP-BE' | 'TET-THIEU-NHI';
  categoryHint: string;
}

export const Q3_COMPARISON_CARDS: Q3ComparisonCard[] = [
  {
    id: 'c-bb-1',
    text: 'Ngày 03 tháng 3.',
    targetFestival: 'BUP-BE',
    categoryHint: 'Thời gian',
  },
  {
    id: 'c-ttn-1',
    text: 'Ngày 05 tháng 5.',
    targetFestival: 'TET-THIEU-NHI',
    categoryHint: 'Thời gian',
  },
  {
    id: 'c-bb-2',
    text: 'Dành cho các bé gái.',
    targetFestival: 'BUP-BE',
    categoryHint: 'Dành cho ai',
  },
  {
    id: 'c-ttn-2',
    text: 'Theo nội dung bài đọc, trước đây ngày này dành cho các bé trai và đã trở thành ngày nghỉ lễ toàn quốc của Nhật Bản.',
    targetFestival: 'TET-THIEU-NHI',
    categoryHint: 'Dành cho ai',
  },
  {
    id: 'c-bb-3',
    text: 'Các gia đình cầu may mắn và sức khoẻ cho các bé gái.',
    targetFestival: 'BUP-BE',
    categoryHint: 'Ý nghĩa',
  },
  {
    id: 'c-ttn-3',
    text: 'Thể hiện ước mong về sức khoẻ và sự thành công cho các bé.',
    targetFestival: 'TET-THIEU-NHI',
    categoryHint: 'Ý nghĩa',
  },
  {
    id: 'c-bb-4',
    text: 'Trưng bày nhiều búp bê Hi-na.',
    targetFestival: 'BUP-BE',
    categoryHint: 'Hoạt động',
  },
  {
    id: 'c-ttn-4',
    text: 'Treo những dải cờ hình cá chép sặc sỡ, nhiều màu.',
    targetFestival: 'TET-THIEU-NHI',
    categoryHint: 'Hoạt động',
  },
  {
    id: 'c-bb-5',
    text: 'Quây quần bên nhau.',
    targetFestival: 'BUP-BE',
    categoryHint: 'Hoạt động',
  },
  {
    id: 'c-bb-6',
    text: 'Ăn cơm đậu đỏ, bánh hi-si-mô-chi.',
    targetFestival: 'BUP-BE',
    categoryHint: 'Hoạt động',
  },
];

export const Q5_VIETNAM_HOLIDAYS = [
  {
    id: 'trung-thu',
    name: 'Tết Trung thu (Rằm tháng Tám)',
    emoji: '🌕🏮',
    description: 'Đêm hội trăng rằm ấm áp với đèn ông sao, chú Cuội, chị Hằng và mâm cỗ trông trăng.',
    suggestedActivities: [
      'Rước đèn ông sao lung linh',
      'Xem múa lân rộn ràng',
      'Phá cỗ trông trăng cùng gia đình, bạn bè',
      'Ăn bánh nướng, bánh dẻo và hoa quả',
      'Làm lồng đèn, mặt nạ truyền thống',
    ],
  },
  {
    id: 'quoc-te-thieu-nhi',
    name: 'Ngày Quốc tế Thiếu nhi 1/6',
    emoji: '🎈🎁',
    description: 'Ngày hội vui tươi đầu mùa hè dành riêng cho các bạn nhỏ trên khắp đất nước.',
    suggestedActivities: [
      'Được ông bà, bố mẹ tặng quà và lời chúc yêu thương',
      'Đi công viên, sở thú hoặc khu vui chơi',
      'Tham gia biểu diễn văn nghệ, trò chơi dân gian',
      'Liên hoan vui vẻ cùng các bạn ở lớp, ở khu phố',
      'Đi xem xiếc, múa rối hoặc xem phim hoạt hình',
    ],
  },
];
