import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const now = "2026-04-27T20:30:00.000+09:00";
const project = {
  id: "project-demo-kotonoha",
  title: "星降る街の郵便屋",
  chapters: [
    {
      id: "chapter-demo-1",
      title: "第一章　星屑の配達",
      summary:
        "夜だけ空に浮かぶ街ルミナで、新米郵便屋ミオが差出人不明の星屑封筒を受け取る。封筒は消えた天文学者リゼの筆跡で、街の灯台時計が止まる前兆を示している。",
      updatedAt: now,
      sections: [
        {
          id: "section-demo-1",
          title: "第一節　夜明け前の郵便局",
          body:
            "ルミナの街では、夜明けの鐘が鳴る少し前にだけ、星屑で封をした手紙が届く。\n\nミオは古い郵便局の窓を開け、まだ青い空気を胸いっぱいに吸い込んだ。机の上には、差出人のない黒い封筒が一通だけ置かれている。封蝋には、三日月と灯台を組み合わせた紋章。五年前に消えた天文学者リゼが好んで使っていた印だった。\n\n「また、リゼ先生のいたずらならいいのに」\n\nそう呟いた瞬間、街の中心にある灯台時計が、一度だけ低く震えた。針は午前四時十三分で止まっている。ミオは封筒を鞄にしまい、まだ眠る石畳の坂道へ駆け出した。",
          summary:
            "新米郵便屋ミオが、消えた天文学者リゼの紋章が入った差出人不明の黒い封筒を見つける。灯台時計が止まり、異変が始まる。",
          updatedAt: now,
        },
        {
          id: "section-demo-2",
          title: "第二節　時計塔の灯",
          body:
            "灯台時計の足元には、夜警のセナが先に到着していた。彼は片手でランタンを掲げ、もう片方の手で歯車室の扉を押さえている。\n\n「中から風の音がする。けれど、今日は凪のはずだ」\n\nミオが封筒を見せると、セナの表情が変わった。封筒の裏には、薄い銀色の文字が浮かんでいる。\n\n『最後の配達先は、星の落ちる場所』\n\n二人が顔を見合わせたとき、灯台の頂上から小さな光がこぼれた。それは火ではなく、夜空から剥がれ落ちたような冷たい光だった。",
          summary:
            "ミオと夜警セナが灯台時計で合流し、封筒に浮かぶ謎の文字を読む。灯台から星のような冷たい光がこぼれる。",
          updatedAt: now,
        },
      ],
    },
    {
      id: "chapter-demo-2",
      title: "第二章　消えた天文学者",
      summary:
        "ミオとセナはリゼの旧研究室へ向かい、ルミナが空に浮かぶ仕組みと、星屑郵便に隠された秘密を知る。",
      updatedAt: now,
      sections: [
        {
          id: "section-demo-3",
          title: "第一節　封じられた観測室",
          body:
            "リゼの観測室は、街のいちばん高い屋根裏に残されていた。鍵穴には埃が積もっていたが、黒い封筒を近づけると、内側から小さな音がして錠が外れた。\n\n部屋の壁一面には、ルミナの星図が貼られている。赤いインクで囲まれた一点には、ミオの家の住所が書かれていた。",
          summary:
            "リゼの観測室が黒い封筒で開き、星図の中にミオの家の住所が示されていることが分かる。",
          updatedAt: now,
        },
      ],
    },
  ],
  characters: [
    {
      id: "character-demo-mio",
      name: "ミオ",
      description:
        "ルミナ郵便局の新米郵便屋。亡き祖母から譲られた革鞄を大切にしている。怖がりだが、手紙を届ける約束だけは破らない。",
    },
    {
      id: "character-demo-sena",
      name: "セナ",
      description:
        "灯台時計を見回る若い夜警。無口で慎重。リゼの失踪に個人的な負い目を感じている。",
    },
    {
      id: "character-demo-rize",
      name: "リゼ",
      description:
        "五年前に消えた天文学者。星屑郵便の研究者で、ルミナが空に浮かぶ理由を知っていた可能性がある。",
    },
  ],
  locations: [
    {
      id: "location-demo-lumina",
      name: "ルミナ",
      description:
        "夜だけ空に浮かぶ坂の街。灯台時計の光で浮力を保っていると信じられている。",
    },
    {
      id: "location-demo-post",
      name: "ルミナ郵便局",
      description:
        "星屑で封をされた手紙が届く古い郵便局。ミオが働く場所。",
    },
    {
      id: "location-demo-clock",
      name: "灯台時計",
      description:
        "街の中心に立つ時計塔。止まると街全体の高度が下がるという古い言い伝えがある。",
    },
  ],
  storyNotes:
    "ジャンル: 少し不思議なファンタジー。\n読後感: 静かで温かいが、謎が次の章へ引っ張る。\n重要設定: 星屑郵便は、過去から未来へ直接届くわけではなく、街の記憶を媒介にして届く。\n伏線: ミオの祖母とリゼは知り合いだった。",
  createdAt: now,
  updatedAt: now,
};

mkdirSync("data", { recursive: true });
writeFileSync(
  join("data", "demo-workspace.json"),
  JSON.stringify({ activeProjectId: project.id, projects: [project] }, null, 2),
);

const sql = `
delete from projects;
delete from app_state;
insert into projects (id, payload, updated_at)
values (${quote(project.id)}, ${quote(JSON.stringify(project))}, ${quote(project.updatedAt)});
insert into app_state (key, value)
values ('active_project_id', ${quote(project.id)});
`;

run("sqlite3", [join("data", "novel_assistant.sqlite")], sql);
console.log("Seeded demo workspace: data/novel_assistant.sqlite");

function quote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function run(command, args, input) {
  const result = spawnSync(command, args, {
    encoding: "utf-8",
    input,
    stdio: ["pipe", "inherit", "inherit"],
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed`);
  }
}
