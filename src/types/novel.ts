export type Chapter = {
  id: string;
  title: string;
  sections: Section[];
  summary?: string;
  updatedAt: string;
};

export type Section = {
  id: string;
  title: string;
  body: string;
  summary?: string;
  updatedAt: string;
};

export type CharacterProfile = {
  id: string;
  name: string;
  description: string;
};

export type WorldLocation = {
  id: string;
  name: string;
  description: string;
};

export type NovelProject = {
  id: string;
  title: string;
  chapters: Chapter[];
  characters: CharacterProfile[];
  locations: WorldLocation[];
  storyNotes: string;
  createdAt: string;
  updatedAt: string;
};
