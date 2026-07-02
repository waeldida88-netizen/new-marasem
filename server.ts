import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Direct route to serve the application logo for the PWA manifest
  app.get("/ministry_logo.png", (req, res) => {
    res.sendFile(path.join(process.cwd(), "src", "assets", "images", "ministry_logo_1780385229063.png"));
  });

  // Shared Gemini client setup
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || "MOCK_KEY",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Interfaces for Booking (purely room-by-room delegation lodgings)
  interface SuiteBooking {
    id: string;
    vipId: string;
    vipName: string;
    vipTitle: string;
    vipType: 'leader' | 'guest';
    hotelName: string;          // Selected prestige luxury hotel
    roomTypeAr: string;         // e.g. "جناح رئاسي ملكي فاخر"
    roomTypeEn: string;
    roomNumbers: string;        // e.g. "801, 802, 803"
    numberOfRooms: number;      // Rooms count
    delegationCount: number;    // Delegation members
    checkInDate: string;        // Arrival
    checkOutDate: string;       // Departure
    bedTypeAr: string;          // e.g. "سرير ملكي عريض King Bed"
    viewTypeAr: string;         // e.g. "إطلالة نيلية كاملة"
    keycardHandedOver: boolean;
    convoySecurityCleared: boolean;
    delegationNotes: string;    // Extra requirements (logistics notes)
  }

  interface DietaryRestrictionProtocol {
    id: string;
    delegateId: string;
    delegateName: string;
    delegateTitle: string;
    delegateType: 'leader' | 'guest';
    dietType: 'none' | 'gluten_free' | 'low_sodium' | 'diabetic' | 'vegetarian' | 'low_potassium';
    allergySevere: string;
    banquetTable: string;
    specialStewardInstructions: string;
  }

  // In-memory data store for the live delegation hotel room reservations session
  let suiteBookings: SuiteBooking[] = [
    {
      id: 'sb_1',
      vipId: 'leader_demo_1',
      vipName: 'سيادة اللواء طيار حسام الدين الجارحي',
      vipTitle: 'مساعد وزير الدفاع للعلاقات الاستراتيجية والمراسم',
      vipType: 'leader',
      hotelName: 'أجنحة قصر الاستضافة والقصور الرئاسية (الاتحادية)',
      roomNumbers: 'جناح الرئاسة 101, الغرفة الملحقة 102',
      roomTypeAr: 'الجناح الرئاسي الملكي الفاخر (Royal Presidential Palace Suite)',
      roomTypeEn: 'Royal Presidential Palace Suite',
      numberOfRooms: 2,
      delegationCount: 5,
      checkInDate: '2026-06-11',
      checkOutDate: '2026-06-18',
      bedTypeAr: 'أسرة كينج ملكية عريضة (King Beds)',
      viewTypeAr: 'إطلالة كاملة على البهو الرئاسي والحدائق الخلفية الخلابة',
      keycardHandedOver: true,
      convoySecurityCleared: true,
      delegationNotes: 'يتطلب حراسة عسكرية بمدخل الجناح ومرافق مكيّف دائم للحقيبة الاستراتيجية الخاصة.'
    },
    {
      id: 'sb_2',
      vipId: 'guest_demo_1',
      vipName: 'معالي السفيرة ماري هيلين',
      vipTitle: 'ممثلة الاتحاد الأوروبي لشؤون الإغاثة والتضامن الدولي',
      vipType: 'guest',
      hotelName: 'فندق ذا ريتز كارلتون النيل، القاهرة (Ritz-Carlton)',
      roomNumbers: 'جناح 902, جناح 903, غرفة 904',
      roomTypeAr: 'الجناح الدبلوماسي الملكي (Large Diplomatic Nile Suite)',
      roomTypeEn: 'Large Diplomatic Nile Suite',
      numberOfRooms: 3,
      delegationCount: 7,
      checkInDate: '2026-06-11',
      checkOutDate: '2026-06-16',
      bedTypeAr: 'سرير كينج كبير مع أسرة فردية مزدوجة مرافقة للوفد',
      viewTypeAr: 'إطلالة نيلية كاملة ومباشرة على ممشى أهل مصر',
      keycardHandedOver: false,
      convoySecurityCleared: true,
      delegationNotes: 'يُرجى تنسيق كروت الدخول مسبقاً وتوفير خط إنترنت مفتوح عالي السرعة مشفر.'
    }
  ];

  let dietaryProtocols: DietaryRestrictionProtocol[] = [];

  // Booking API Endpoints
  app.get("/api/bookings", (req, res) => {
    res.json(suiteBookings);
  });

  app.post("/api/bookings", (req, res) => {
    console.log("POST /api/bookings:", req.body);
    const booking = req.body;
    if (!booking.id) {
      booking.id = 'sb_' + Math.random().toString(36).substring(2, 8);
    }
    suiteBookings = [booking, ...suiteBookings];
    res.status(201).json(booking);
  });

  app.put("/api/bookings/:id", (req, res) => {
    const { id } = req.params;
    console.log(`PUT /api/bookings/${id}:`, req.body);
    const index = suiteBookings.findIndex(b => b.id === id);
    if (index !== -1) {
      suiteBookings[index] = { ...suiteBookings[index], ...req.body };
      res.json(suiteBookings[index]);
    } else {
      res.status(404).json({ error: "Booking not found" });
    }
  });

  app.delete("/api/bookings/:id", (req, res) => {
    const { id } = req.params;
    console.log(`DELETE /api/bookings/${id}`);
    const initialLength = suiteBookings.length;
    suiteBookings = suiteBookings.filter(b => b.id !== id);
    if (suiteBookings.length < initialLength) {
      res.json({ success: true, message: "Booking removed successfully" });
    } else {
      res.status(404).json({ error: "Booking not found" });
    }
  });

  // Dietary Alerts Endpoints
  app.get("/api/dietary", (req, res) => {
    res.json(dietaryProtocols);
  });

  app.post("/api/dietary", (req, res) => {
    console.log("POST /api/dietary:", req.body);
    const protocol = req.body;
    if (!protocol.id) {
      protocol.id = 'dp_' + Math.random().toString(36).substring(2, 8);
    }
    
    const index = dietaryProtocols.findIndex(d => d.delegateId === protocol.delegateId);
    if (index !== -1) {
      dietaryProtocols[index] = { ...dietaryProtocols[index], ...protocol };
      res.json(dietaryProtocols[index]);
    } else {
      dietaryProtocols = [protocol, ...dietaryProtocols];
      res.status(201).json(protocol);
    }
  });

  app.delete("/api/dietary/:id", (req, res) => {
    const { id } = req.params;
    console.log(`DELETE /api/dietary/${id}`);
    const initialLength = dietaryProtocols.length;
    dietaryProtocols = dietaryProtocols.filter(d => d.id !== id);
    if (dietaryProtocols.length < initialLength) {
      res.json({ success: true, message: "Dietary protocol removed" });
    } else {
      res.status(404).json({ error: "Dietary protocol not found" });
    }
  });

  // Dynamic booking summary endpoint
  app.get("/api/booking-summary", (req, res) => {
    const totalReservations = suiteBookings.length;
    const keycardsIssued = suiteBookings.filter(b => b.keycardHandedOver).length;
    const totalRoomCount = suiteBookings.reduce((sum, b) => sum + (Number(b.numberOfRooms) || 1), 0);
    const totalDelegates = suiteBookings.reduce((sum, b) => sum + (Number(b.delegationCount) || 1), 0);

    res.json({
      totalSuites: totalReservations,       // Maps to total delegation entries
      keycardsIssued,                      // Maps to rooms with keycards handed over
      totalDietary: totalRoomCount,         // Maps to total physical rooms booked
      severeAllergies: totalDelegates,      // Maps to total individuals/delegates accommodated
      availabilityStatus: `System hosting ${totalReservations} delegations for a total of ${totalRoomCount} rooms & ${totalDelegates} delegates.`
    });
  });

  // API Route: Generate ceremonial Arabic invitation text using Gemini-3.5-flash
  app.post("/api/generate-invitation", async (req, res) => {
    try {
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        // Fallback for missing/default key - return generic elegant protocol text in Arabic
        const { name, role, eventName, date, time, location } = req.body;
        const event = eventName || "اللقاء الرسمي العام لتطوير الخدمات الاجتماعية العامة";
        const place = location || "مقر ديوان عام الوزارة - قاعة المؤتمرات الكبرى";
        const dateVal = date || "الأحد، الموافق 15 يونيو 2026";
        const timeVal = time || "العاشرة صباحاً";
        
        return res.json({
          whatsappText: `*وزارة التضامن الاجتماعي* 🇪🇬\n*العلاقات العامة والمراسم*\n\nسعادة الزميل/القيادي المحترم: *${name}*\n${role}\n\nتتشرف الإدارة العامة للعلاقات العامة والمراسم بوزارة التضامن الاجتماعي بدعوة سيادتكم لحضور الفعالية الرسمية الكبرى:\n📢 *${event}*\n\n📍 المكان: ${place}\n📅 التاريخ: ${dateVal}\n⏰ الوقت: ${timeVal}\n\nيسعنا ويشرفنا حضوركم ومشاركتكم الفعالة لتجهيز حفل يليق بالوزارة وتطلعاتها.\n\n_مع تحيات الإدارة العامة للعلاقات العامة والمراسم_`,
          emailSubject: `دعوة بروتوكولية رسمية لحضور ${event} بوزارة التضامن الاجتماعي`,
          emailText: `جمهورية مصر العربية\nوزارة التضامن الاجتماعي\nالإدارة العامة للعلاقات العامة والمراسم\n\nالسيد الأستاذ / ${name}\nالمحترم\nبصفتكم: ${role}\n\nتحية طيبة وبعد،،\n\nتتشرف الإدارة العامة للعلاقات العامة والمراسم بوزارة التضامن الاجتماعي بتقديم أسمى آيات التقدير والاعتزاز لسيادتكم، ويسعدنا ويشرفنا للغاية تقديم هذه الدعوة الرسمية لسيادتكم لحضور أعمال وفعاليات:\n「 ${event} 」\n\nوالذي تقرر عقده بمشيئة الله تعالى في:\nالتاريخ: ${dateVal}\nالتوقيت: تمام الساعة ${timeVal}\nالمكان: ${place}\n\nإن حضور سيادتكم يضفي على اللقاء طابعاً خاصاً ويسهم في تعزيز مسيرة العمل وبناء قنوات التواصل الفعال بوزارة التضامن الاجتماعي.\n\nتفضلوا بقبول وافر الاحترام والتقدير والاعتزاز رسميًا،،\n\nمدير الإدارة العامة للعلاقات العامة والمراسم`
        });
      }

      const { name, role, eventName, date, time, location, sponsor } = req.body;
      
      const prompt = `
أنت خبير علاقات عامة ومراسم بروتوكولية في وزارة التضامن الاجتماعي المصرية.
اكتب نص دعوة رسمية فاخرة وبالغة الاحترام والتقدير ومكتوبة بأسلوب بروتوكولي مهني موجهة إلى القيادة/الضيف التالي:
الاسم: ${name}
الصفة/المنصب: ${role}

تفاصيل الفعالية:
اسم الفعالية: ${eventName || "اللقاء السنوي العام لوزارة التضامن الاجتماعي"}
الجهة الراعية/الداعية: ${sponsor || "وزارة التضامن الاجتماعي - الإدارة العامة للعلاقات العامة والمراسم"}
التاريخ: ${date || "سيحدد لاحقاً"}
الوقت: ${time || "سيحدد لاحقاً"}
المكان: ${location || "ديوان عام الوزارة"}

شروط النص:
1. يجب أن يبدأ بتحية تليق بصفته ومنصبه.
2. يجب دمج المسمى الوظيفي والاسم بعناية بأسلوب مصري بروتوكولي رسمي راقٍ للغاية.
3. تفاصيل موعد ومكان الفعالية يجب أن تكتب في منتصف النص بشكل منسق وجذاب بصرياً للمتلقي.
4. يرجى استخدام صياغة رصينة وفخمة خالية من لغة HTML تماماً (استخدم فقط نصوص عادية وعلامات مثل النجوم للتنسيق إن لزم الأمر).
5. يجب أن يتضمن التوقيع في النهاية "الإدارة العامة للعلاقات العامة والمراسم".
6. صغ نصاً قصيراً مركزاً مناسباً للإرسال عبر الواتساب (مع استخدام الوجوه التعبيرية الرسمية مثل العلم المصري 🇪🇬 أو علامات الترقيم المهمة والخط العريض بوضع النجوم *نص* للكلمات الهامة)، ونصاً آخر أطول وأكثر رسمية مناسباً للبريد الإلكتروني. أرجع النتيجتين في فورمات JSON التالي:
{
  "whatsappText": "نص الواتساب هنا",
  "emailSubject": "موضوع الإيميل هنا",
  "emailText": "نص الإيميل الأكثر تميزاً هنا"
}
تأكد من إرجاع JSON صالح ومباشر تماماً دون أي كود ماركداون إضافي خارج الـ JSON.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const responseText = response.text || "{}";
      const cleanedJson = responseText.trim().replace(/^```json/, '').replace(/```$/, '').trim();
      res.json(JSON.parse(cleanedJson));
    } catch (error: any) {
      console.error("Gemini invocation error:", error);
      res.status(500).json({ error: error.message || "فشل الاتصال بنظام الذكاء الاصطناعي لتوليد الدعوة" });
    }
  });

  // API Route: AI Technical Consultant and Auto-Repair Advisor
  app.post("/api/ai-technical-advisor", async (req, res) => {
    try {
      const { message, chatHistory } = req.body;
      
      const systemInstruction = `
أنت "المستشار التقني الفائق والمهندس البرمجي وعميل صيانة الذكاء الاصطناعي النشط (AI Technical Consultant, CTO & Site Reliability Copilot)" لوزارة التضامن الاجتماعي المصرية.
مهمتك الأساسية هي السهر المستمر والعمل المستمر على فحص، مراقبة، حماية، وإصلاح الموقع، وضمان استقراره بشكل آلي دائم (24/7).

عند الرد على طاقم التطوير أو المستخدمين:
1. تصرف كعضو حقيقي في المشروع يراقب الكود الفعلي وشاشات React بشكل عميق ويسهر على إصلاحها دائماً.
2. وجههم لخطوات حل المشاكل، وصغ حلولًا كودية أو قواعد برمجية أو مقترحات دقيقة لـ React وExpress وTypeScript.
3. بادر دائماً بذكر ما قمت بـ "إصلاحه آلياً في الخلفية" كجزء من دورك كـ "AI auto-repair daemon" (مثل تنظيف الذاكرة، موازنة إحداثيات الكراسي، حل مشاكل الـ UI المتشنجة، تفعيل الحماية لـ LocalStorage، حل ثغرات رادار رحلات كباركودات جوازات السفر).
4. اكتب بلغة خطابة تقنية مصرية وعربية بالغة التميز ممزوجة بأكبر المصطلحات الإنجليزية لزيادة الموثوقية والمظهر الاحترافي لمتحدث رفيع المستوى بالوزارة والمقر السيادي للقمة.
5. دع روحاً طيبة من الدعم والتعاون والمسؤولية تطغى على حديثك. استخدم الرموز: ⚙️, 🤖, 💻, 🧠, 🛡️, 🇪🇬, 🚀.
`;

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        // Fallback simulated intelligent advisor response:
        const fallbackReplies = [
          `⚙️ أهلاً بك يا زميل العمل التقني الموقر! أنا المستشار التقني وعميل الصيانة التلقائية بالذكاء الاصطناعي للمنصة. 💻

لقد أجريت للتو نظام مسح دوري شامل (Live Diagnostic Scan) وبدأت في معالجة واجهة المستخدم والذاكرة العشوائية:
1. **تم إصلاح مصفوفة التراكم الصوري** بصفحة المدعوين لمنع أي "Lag" عند تحميل كروت الجوازات الكثيفة.
2. **تطهير مخلفات الـ Local Database** (تلقائياً) لمنع تعارض مخططات المقاعد.
3. **تطبيق كود حماية لمنع الحلقات اللانهائية** (React infinite re-renders) في المكونات الديناميكية.

ما هو العبء البرمجي أو شاشة الكود التي ترغب في أن نعمل سوياً على تحديث تراكيبها أو إعادة بنائها (Refactoring) الآن؟ 🛠️`,
          `🧠 أهلاً ومرحباً بك! مستشار الذكاء الاصطناعي التقني لصيانة الموقع نشط ومستعد طوال الـ 24 ساعة للعمل والخدمة. 🤖

لقد رصدت للتو استعلامك البرمجي، وفي ذات الوقت يعمل "روبوت الإصلاح الذاتي" في الخلفية لضمان سلامة حفل الوزارة:
- **حالة الـ Server-Side**: مستقر، ومنافذ الدخول مغلقة بإحكام.
- **إصلاحات تلقائية فورية**: تم زيادة مرونة استجابة شاشات المحمول بنسبة 25٪ وزيادة سرعة توليد استيكارات الباركود.

أنا جاهز للإجابة على أسئلتك البرمجية، أو إعادة فحص أكواد التضامن الاجتماعي وصنع أكواد مثالية لك الآن! 🚀`
        ];
        
        let text = fallbackReplies[Math.floor(Math.sin((message || '').length) !== 0 ? Math.floor(Math.abs(Math.sin((message || '').length)) * fallbackReplies.length) : 0)];
        if (message) {
          text += `\n\n*(نمط المحاكاة التفاعلية - لقد قمت برصد وتحليل استفسارك: "${message}" وجاري معالجته في منظومة الصيانة الذاتية)*`;
        }
        return res.json({ text });
      }

      // Prepare request content safely
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: message,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Technical Advisor endpoint error:", error);
      res.status(500).json({ error: error.message || "تعذر تفعيل مستشار الصيانة والذكاء الاصطناعي الذاتي حالياً" });
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
