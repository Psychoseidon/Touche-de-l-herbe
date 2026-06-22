export function getAge(birthDate: Date | null): number | null {
  if (!birthDate) return null;

  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > birthDate.getMonth() ||
    (now.getMonth() === birthDate.getMonth() && now.getDate() >= birthDate.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;

  return age;
}

// Protection 18-25 : les 18-19 ans ne peuvent interagir en 1:1 (intérêt, swipe,
// messages) qu'avec d'autres 18-25 ans ; les 20-25 ans interagissent avec tout
// le monde ; les 26+ ne peuvent pas interagir avec les 18-19 ans.
export function canInteract(ageA: number | null, ageB: number | null): boolean {
  if (ageA === null || ageB === null) return true;

  const isYoung = (age: number) => age >= 18 && age <= 19;
  const isProtectedBracket = (age: number) => age >= 18 && age <= 25;

  if (isYoung(ageA)) return isProtectedBracket(ageB);
  if (isYoung(ageB)) return isProtectedBracket(ageA);
  return true;
}
