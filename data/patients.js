const patients = [];

// 讓 Firebase 同步模組可安全取得同一份患者陣列。
window.patients = patients;

function generateRegistrationTime(index) {

  const startMinutes =
    13 * 60 + 30;

  const totalMinutes =
    startMinutes + index * 5;

  const hour =
    Math.floor(
      totalMinutes / 60
    );

  const minute =
    totalMinutes % 60;

  return (
    String(hour).padStart(2, "0") +
    ":" +
    String(minute).padStart(2, "0")
  );
}

function maskPatientName(name) {
  const trimmed = String(name ?? "").trim();

  if (!trimmed) {
    return "未命名個案";
  }

  if (trimmed.length === 1) {
    return trimmed;
  }

  if (trimmed.length === 2) {
    return `${trimmed[0]}○`;
  }

  return `${trimmed[0]}○${trimmed[trimmed.length - 1]}`;
}