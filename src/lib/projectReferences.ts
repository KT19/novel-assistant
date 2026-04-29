import { createId } from "./id";
import type { CharacterProfile, NovelProject, WorldLocation } from "../types/novel";

export function addCharacterToProject(project: NovelProject): CharacterProfile[] {
  return [
    ...project.characters,
    {
      id: createId("character"),
      name: "新しい人物",
      description: "",
    },
  ];
}

export function updateCharacterInProject(
  project: NovelProject,
  characterId: string,
  input: Partial<Pick<CharacterProfile, "name" | "description">>,
): CharacterProfile[] {
  return project.characters.map((character) =>
    character.id === characterId ? { ...character, ...input } : character,
  );
}

export function deleteCharacterFromProject(
  project: NovelProject,
  characterId: string,
): CharacterProfile[] {
  return project.characters.filter((character) => character.id !== characterId);
}

export function addLocationToProject(project: NovelProject): WorldLocation[] {
  return [
    ...project.locations,
    {
      id: createId("location"),
      name: "新しい場所",
      description: "",
    },
  ];
}

export function updateLocationInProject(
  project: NovelProject,
  locationId: string,
  input: Partial<Pick<WorldLocation, "name" | "description">>,
): WorldLocation[] {
  return project.locations.map((location) =>
    location.id === locationId ? { ...location, ...input } : location,
  );
}

export function deleteLocationFromProject(
  project: NovelProject,
  locationId: string,
): WorldLocation[] {
  return project.locations.filter((location) => location.id !== locationId);
}
