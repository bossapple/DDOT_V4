import { ColorBlindType } from "../(main)/Admin/[name]/Patient/[userId]/page";

export function dobToAge(dateOfBirth: string) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
  
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  
    return age;
  }

export function millisecondsToTime(milliseconds: string) {
  const millisecondsNumber = Number(milliseconds)
  const seconds = Math.floor(millisecondsNumber / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = (minutes % 60).toString().padStart(2, '0');
  const formattedSeconds = (seconds % 60).toString().padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

export function countColorblindResult(colorBlindArray: ColorBlindType[] | undefined) {
  let passCount = 0
  let failedCount = 0
  let totalCount = 0

  if(colorBlindArray) {
    colorBlindArray.forEach(colorBlind => {
      if(colorBlind.incorrect > 2) {
        failedCount += 1
      } else {
        passCount += 1
      }
    })
    totalCount = failedCount + passCount
  }
  return { totalCount, passCount, failedCount }
}

