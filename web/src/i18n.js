import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      nav: { matrix: 'Persona Matrix', lens: 'Explainability Lens',
        sources: 'Data Sources', miner: 'Data Miner', elicit: 'Expert Elicitor', convert: 'Converter', vlam: 'Action Miner',
        production: 'Production', deploy: '1-Click Deploy', healing: 'Self-Healing', rlhf: 'Tinder for RLHF', flywheel: 'Data Flywheel',
        platform: 'Platform', marketplace: 'Marketplace', leaderboard: 'Leaderboard', team: 'Team Workspace',
        training: 'Training', wizard: 'AI Wizard', prompt: 'Prompt Studio', compiler: 'Prompt Compiler', finetune: 'Fine-Tune Studio',
        logbook: 'Training Logbook', calculator: 'Cost Calculator', arena: 'Model Arena', eval: 'Auto-Eval',
        synth: 'Synth Factory', management: 'Data Management', annotate: 'Annotation Studio', inspector: 'Health Inspector',
        dna: 'DNA Scanner', washer: 'IP Washer', versions: 'Version Control', redteam: 'Red Team', chat: 'AI Chat', webhooks: 'Integrations', settings: 'Settings'
      }
    }
  },
  es: {
    translation: { nav: { matrix: 'Persona Matrix', lens: 'Explainability Lens', sources: 'Fuentes de Datos', miner: 'Minero de Datos', elicit: 'Elicitador Experto', convert: 'Convertidor', vlam: 'Minero de Acción', production: 'Producción', deploy: 'Despliegue 1-Clic', healing: 'Auto-Sanación', rlhf: 'Tinder para RLHF', flywheel: 'Volante de Datos', platform: 'Plataforma', marketplace: 'Mercado', leaderboard: 'Tabla de Posiciones', team: 'Espacio de Trabajo', training: 'Entrenamiento', wizard: 'Asistente IA', prompt: 'Estudio de Prompts', compiler: 'Compilador de Prompts', finetune: 'Ajuste Fino', logbook: 'Bitácora', calculator: 'Calculadora', arena: 'Arena de Modelos', eval: 'Auto-Evaluación', synth: 'Fábrica de Síntesis', management: 'Gestión de Datos', annotate: 'Estudio de Anotación', inspector: 'Inspector', dna: 'Escáner de ADN', washer: 'Lavador IP', versions: 'Control de Versiones', redteam: 'Equipo Rojo', chat: 'Chat IA', webhooks: 'Integraciones', settings: 'Ajustes' } }
  },
  fr: {
    translation: { nav: { matrix: 'Persona Matrix', lens: 'Explainability Lens', sources: 'Sources de Données', miner: 'Mineur de Données', elicit: 'Élicitation', convert: 'Convertisseur', vlam: 'Mineur d Action', production: 'Production', deploy: 'Déploiement 1-Clic', healing: 'Auto-Guérison', rlhf: 'Tinder pour RLHF', flywheel: 'Volant', platform: 'Plateforme', marketplace: 'Marché', leaderboard: 'Classement', team: 'Espace Équipe', training: 'Entraînement', wizard: 'Assistant IA', prompt: 'Studio de Prompts', compiler: 'Compilateur de Prompts', finetune: 'Affinage', logbook: 'Journal de Bord', calculator: 'Calculateur', arena: 'Arène', eval: 'Auto-Éval', synth: 'Fabrique', management: 'Gestion', annotate: 'Annotation', inspector: 'Inspecteur', dna: 'Scanner ADN', washer: 'Laveur IP', versions: 'Versions', redteam: 'Équipe Rouge', chat: 'Chat IA', webhooks: 'Intégrations', settings: 'Paramètres' } }
  },
  de: {
    translation: { nav: { matrix: 'Persona Matrix', lens: 'Explainability Lens', sources: 'Datenquellen', miner: 'Datenminer', elicit: 'Elicitor', convert: 'Konverter', vlam: 'Aktions-Miner', production: 'Produktion', deploy: '1-Klick Deployment', healing: 'Selbstheilung', rlhf: 'Tinder für RLHF', flywheel: 'Flywheel', platform: 'Plattform', marketplace: 'Marktplatz', leaderboard: 'Bestenliste', team: 'Team', training: 'Training', wizard: 'KI-Assistent', prompt: 'Prompt-Studio', compiler: 'Prompt-Compiler', finetune: 'Feinabstimmung', logbook: 'Logbuch', calculator: 'Rechner', arena: 'Arena', eval: 'Auto-Eval', synth: 'Synthese', management: 'Verwaltung', annotate: 'Annotation', inspector: 'Inspektor', dna: 'DNA-Scanner', washer: 'IP-Wäscher', versions: 'Versionen', redteam: 'Red Team', chat: 'KI-Chat', webhooks: 'Integrationen', settings: 'Einstellungen' } }
  },
  it: {
    translation: { nav: { matrix: 'Persona Matrix', lens: 'Explainability Lens', sources: 'Fonti di Dati', miner: 'Minatore', elicit: 'Estrattore', convert: 'Convertitore', vlam: 'Minatore di Azioni', production: 'Produzione', deploy: 'Distribuzione', healing: 'Auto-Guarigione', rlhf: 'Tinder per RLHF', flywheel: 'Volano', platform: 'Piattaforma', marketplace: 'Mercato', leaderboard: 'Classifica', team: 'Team', training: 'Addestramento', wizard: 'Mago IA', prompt: 'Studio Prompt', compiler: 'Compilatore Prompt', finetune: 'Fine-Tune', logbook: 'Registro', calculator: 'Calcolatore', arena: 'Arena', eval: 'Auto-Valutazione', synth: 'Sintesi', management: 'Gestione Dati', annotate: 'Annotazione', inspector: 'Ispettore', dna: 'Scanner DNA', washer: 'Lavatore IP', versions: 'Versioni', redteam: 'Red Team', chat: 'Chat IA', webhooks: 'Integrazioni', settings: 'Impostazioni' } }
  },
  nl: {
    translation: { nav: { matrix: 'Persona Matrix', lens: 'Explainability Lens', sources: 'Bronnen', miner: 'Delfstof', elicit: 'Expert Elicitor', convert: 'Omvormer', vlam: 'Actie Miner', production: 'Productie', deploy: '1-Klik Uitrol', healing: 'Zelfgenezing', rlhf: 'Tinder voor RLHF', flywheel: 'Vliegwiel', platform: 'Platform', marketplace: 'Marktplaats', leaderboard: 'Scorebord', team: 'Teamwerkplek', training: 'Opleiding', wizard: 'AI Tovenaar', prompt: 'Prompt Studio', compiler: 'Prompt Compiler', finetune: 'Fijnafstemming', logbook: 'Logboek', calculator: 'Kostenberekenaar', arena: 'Model Arena', eval: 'Auto-Eval', synth: 'Synthese', management: 'Beheer', annotate: 'Annotatie', inspector: 'Inspecteur', dna: 'DNA-Scanner', washer: 'IP-Wasmachine', versions: 'Versies', redteam: 'Rood Team', chat: 'AI Chat', webhooks: 'Integraties', settings: 'Instellingen' } }
  },
  pt: {
    translation: { nav: { matrix: 'Persona Matrix', lens: 'Explainability Lens', sources: 'Fontes', miner: 'Minerador', elicit: 'Extrator', convert: 'Conversor', vlam: 'Minerador de Ações', production: 'Produção', deploy: 'Implantação', healing: 'Auto-Cura', rlhf: 'Tinder para RLHF', flywheel: 'Volante', platform: 'Plataforma', marketplace: 'Mercado', leaderboard: 'Classificação', team: 'Equipe', training: 'Treinamento', wizard: 'Mago de IA', prompt: 'Prompts', compiler: 'Compilador Prompt', finetune: 'Ajuste Fino', logbook: 'Diário', calculator: 'Calculadora', arena: 'Arena', eval: 'Auto-Eval', synth: 'Sintética', management: 'Gestão', annotate: 'Anotação', inspector: 'Inspetor', dna: 'Scanner DNA', washer: 'Limpador de IP', versions: 'Versões', redteam: 'Equipe Vermelha', chat: 'Chat de IA', webhooks: 'Integrações', settings: 'Configurações' } }
  },
  sv: {
    translation: { nav: { matrix: 'Persona Matrix', lens: 'Explainability Lens', sources: 'Datakällor', miner: 'Datagruva', elicit: 'Expert', convert: 'Konverterare', vlam: 'Händelsegruva', production: 'Produktion', deploy: 'Driftsättning', healing: 'Självläkning', rlhf: 'Tinder för RLHF', flywheel: 'Svänghjul', platform: 'Plattform', marketplace: 'Marknadsplats', leaderboard: 'Topplista', team: 'Arbetsyta', training: 'Träning', wizard: 'AI-Trollkarl', prompt: 'Prompt', compiler: 'Prompt-Kompilator', finetune: 'Finjustering', logbook: 'Loggbok', calculator: 'Kalkylator', arena: 'Arena', eval: 'Auto-Utvärdering', synth: 'Syntes', management: 'Hantering', annotate: 'Annotering', inspector: 'Hälsokontroll', dna: 'DNA-Skanner', washer: 'IP-Tvätt', versions: 'Versionskontroll', redteam: 'Rött Lag', chat: 'AI-Chatt', webhooks: 'Integrationer', settings: 'Inställningar' } }
  },
  no: {
    translation: { nav: { matrix: 'Persona Matrix', lens: 'Explainability Lens', sources: 'Kilder', miner: 'Gruve', elicit: 'Ekspert', convert: 'Konverter', vlam: 'Handlingsgruve', production: 'Produksjon', deploy: 'Distribusjon', healing: 'Selvhelbredende', rlhf: 'Tinder for RLHF', flywheel: 'Svinghjul', platform: 'Plattform', marketplace: 'Markedsplass', leaderboard: 'Ledertavle', team: 'Arbeidsområde', training: 'Trening', wizard: 'Veiviser', prompt: 'Prompt', compiler: 'Prompt Kompilator', finetune: 'Finjustering', logbook: 'Loggbok', calculator: 'Kalkulator', arena: 'Arena', eval: 'Auto-Eval', synth: 'Syntese', management: 'Håndtering', annotate: 'Annotering', inspector: 'Helse', dna: 'DNA-Skanner', washer: 'IP-Vasker', versions: 'Versjoner', redteam: 'Rødt Lag', chat: 'Chat', webhooks: 'Integrasjoner', settings: 'Innstillinger' } }
  },
  da: {
    translation: { nav: { matrix: 'Persona Matrix', lens: 'Explainability Lens', sources: 'Kilder', miner: 'Mine', elicit: 'Ekspert', convert: 'Konverter', vlam: 'Handlingsmine', production: 'Produktion', deploy: 'Udrulning', healing: 'Selvhelende', rlhf: 'Tinder til RLHF', flywheel: 'Svinghjul', platform: 'Platform', marketplace: 'Markedsplads', leaderboard: 'Rangliste', team: 'Arbejdsområde', training: 'Træning', wizard: 'Vejleder', prompt: 'Prompt', compiler: 'Prompt Kompiler', finetune: 'Finjustering', logbook: 'Logbog', calculator: 'Beregner', arena: 'Arena', eval: 'Auto-Eval', synth: 'Syntese', management: 'Styring', annotate: 'Annotering', inspector: 'Sundhed', dna: 'DNA Scanner', washer: 'IP-Vasker', versions: 'Versioner', redteam: 'Rødt Hold', chat: 'Chat', webhooks: 'Integrationer', settings: 'Indstillinger' } }
  },
  fi: {
    translation: { nav: { matrix: 'Persona Matrix', lens: 'Explainability Lens', sources: 'Lähteet', miner: 'Louhinta', elicit: 'Asiantuntija', convert: 'Muunnin', vlam: 'Toiminnan Louhinta', production: 'Tuotanto', deploy: 'Käyttöönotto', healing: 'Itseparantuva', rlhf: 'Tinder RLHF:lle', flywheel: 'Vauhtipyörä', platform: 'Alusta', marketplace: 'Markkinapaikka', leaderboard: 'Tulostaulu', team: 'Työtila', training: 'Koulutus', wizard: 'Velho', prompt: 'Prompt', compiler: 'Prompt-Kääntäjä', finetune: 'Hienosäätö', logbook: 'Lokikirja', calculator: 'Laskuri', arena: 'Areena', eval: 'Auto-Eval', synth: 'Synteesi', management: 'Hallinta', annotate: 'Merkintä', inspector: 'Terveys', dna: 'DNA', washer: 'IP-Pesu', versions: 'Versiot', redteam: 'Punainen', chat: 'Chat', webhooks: 'Integraatiot', settings: 'Asetukset' } }
  },
  ru: {
    translation: { nav: { matrix: 'Persona Matrix', lens: 'Explainability Lens', sources: 'Источники данных', miner: 'Сборщик данных', elicit: 'Экспертный опрос', convert: 'Конвертер', vlam: 'Сбор действий', production: 'Продакшн', deploy: 'В 1 клик', healing: 'Самоисцеление', rlhf: 'Tinder для RLHF', flywheel: 'Маховик', platform: 'Платформа', marketplace: 'Маркетплейс', leaderboard: 'Таблица лидеров', team: 'Команда', training: 'Обучение', wizard: 'ИИ Мастер', prompt: 'Промпт Студия', compiler: 'Компилятор промптов', finetune: 'Файнтюнинг', logbook: 'Журнал', calculator: 'Калькулятор', arena: 'Арена', eval: 'Авто-оценка', synth: 'Фабрика синтеза', management: 'Управление', annotate: 'Разметка', inspector: 'Инспектор', dna: 'ДНК Сканер', washer: 'IP Очистка', versions: 'Версии', redteam: 'Red Team', chat: 'ИИ Чат', webhooks: 'Интеграции', settings: 'Настройки' } }
  },
  pl: {
    translation: { nav: { matrix: 'Persona Matrix', lens: 'Explainability Lens', sources: 'Źródła', miner: 'Górnik', elicit: 'Ekspert', convert: 'Konwerter', vlam: 'Górnik Akcji', production: 'Produkcja', deploy: 'Wdrożenie', healing: 'Samoleczenie', rlhf: 'Tinder dla RLHF', flywheel: 'Koło Zamachowe', platform: 'Platforma', marketplace: 'Rynek', leaderboard: 'Tablica Wyników', team: 'Zespół', training: 'Szkolenie', wizard: 'Kreator', prompt: 'Prompt', compiler: 'Kompilator Promptów', finetune: 'Dostrajanie', logbook: 'Dziennik', calculator: 'Kalkulator', arena: 'Arena', eval: 'Auto-Ocena', synth: 'Synteza', management: 'Zarządzanie', annotate: 'Adnotacje', inspector: 'Inspektor', dna: 'Skaner DNA', washer: 'Myjka IP', versions: 'Wersje', redteam: 'Czerwona Drużyna', chat: 'Czat', webhooks: 'Integracje', settings: 'Ustawienia' } }
  },
  el: {
    translation: { nav: { matrix: 'Persona Matrix', lens: 'Explainability Lens', sources: 'Πηγές', miner: 'Εξόρυξη', elicit: 'Ειδικός', convert: 'Μετατροπέας', vlam: 'Εξόρυξη Δράσης', production: 'Παραγωγή', deploy: 'Ανάπτυξη', healing: 'Αυτοΐαση', rlhf: 'Tinder για RLHF', flywheel: 'Τροχός', platform: 'Πλατφόρμα', marketplace: 'Αγορά', leaderboard: 'Κατάταξη', team: 'Ομάδα', training: 'Εκπαίδευση', wizard: 'Οδηγός', prompt: 'Prompt', compiler: 'Μεταγλωττιστής Prompt', finetune: 'Μικρορύθμιση', logbook: 'Ημερολόγιο', calculator: 'Υπολογιστής', arena: 'Αρένα', eval: 'Αξιολόγηση', synth: 'Σύνθεση', management: 'Διαχείριση', annotate: 'Σχολιασμός', inspector: 'Επιθεωρητής', dna: 'Σαρωτής DNA', washer: 'Πλύση IP', versions: 'Εκδόσεις', redteam: 'Κόκκινη Ομάδα', chat: 'Συνομιλία', webhooks: 'Ενσωματώσεις', settings: 'Ρυθμίσεις' } }
  },
  zh: {
    translation: { nav: { matrix: 'Persona Matrix', lens: 'Explainability Lens', sources: '数据源', miner: '数据挖掘', elicit: '专家引导', convert: '转换器', vlam: '动作挖掘', production: '生产环境', deploy: '一键部署', healing: '自我修复', rlhf: 'RLHF 探探', flywheel: '数据飞轮', platform: '平台', marketplace: '市场', leaderboard: '排行榜', team: '团队空间', training: '模型训练', wizard: 'AI 助手', prompt: '提示词', compiler: '提示词编译器', finetune: '微调', logbook: '训练日志', calculator: '成本计算', arena: '竞技场', eval: '自动评估', synth: '合成数据', management: '数据管理', annotate: '标注', inspector: '健康检查', dna: 'DNA 扫描', washer: 'IP 清洗', versions: '版本控制', redteam: '红队测试', chat: '聊天', webhooks: '集成', settings: '设置' } }
  },
  ja: {
    translation: { nav: { matrix: 'Persona Matrix', lens: 'Explainability Lens', sources: 'データソース', miner: 'マイニング', elicit: '専門家', convert: 'コンバーター', vlam: 'アクションマイニング', production: '本番', deploy: 'デプロイ', healing: '自己修復', rlhf: 'RLHF向けTinder', flywheel: 'フライホイール', platform: 'プラットフォーム', marketplace: 'マーケット', leaderboard: 'リーダーボード', team: 'チーム', training: 'トレーニング', wizard: 'ウィザード', prompt: 'プロンプト', compiler: 'プロンプトコンパイラ', finetune: 'ファインチューニング', logbook: 'ログ', calculator: 'コスト計算', arena: 'アリーナ', eval: '自動評価', synth: '合成', management: 'データ管理', annotate: 'アノテーション', inspector: 'ヘルスインスペクター', dna: 'DNAスキャナー', washer: 'IPウォッシャー', versions: 'バージョン管理', redteam: 'レッドチーム', chat: 'チャット', webhooks: '連携', settings: '設定' } }
  },
  ko: {
    translation: { nav: { matrix: 'Persona Matrix', lens: 'Explainability Lens', sources: '데이터 소스', miner: '마이닝', elicit: '전문가', convert: '변환기', vlam: '액션 마이닝', production: '프로덕션', deploy: '배포', healing: '자가 치유', rlhf: 'RLHF용 틴더', flywheel: '플라이휠', platform: '플랫폼', marketplace: '마켓플레이스', leaderboard: '리더보드', team: '팀', training: '학습', wizard: '마법사', prompt: '프롬프트', compiler: '프롬프트 컴파일러', finetune: '파인튜닝', logbook: '로그북', calculator: '비용 계산', arena: '아레나', eval: '자동 평가', synth: '합성', management: '데이터 관리', annotate: '어노테이션', inspector: '검사기', dna: 'DNA 스캐너', washer: 'IP 워셔', versions: '버전 제어', redteam: '레드 팀', chat: '채팅', webhooks: '통합', settings: '설정' } }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;
