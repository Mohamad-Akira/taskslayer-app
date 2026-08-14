export interface ClientValidationResult {
  isSpam: boolean;
  reason?: string;
}

/**
 * Client-side fast heuristic check for spam/gibberish task titles
 */
export function checkTaskSpamClient(title: string): ClientValidationResult {
  const trimmed = title.trim();

  // 1. Extremely short or empty
  if (trimmed.length < 2) {
    return { isSpam: true, reason: 'العنوان قصير جداً' };
  }

  // 2. Pure repeated characters (e.g., "aaaaa", "ssssss", "111111")
  if (/^(.)\1{2,}$/i.test(trimmed)) {
    return { isSpam: true, reason: 'حروف مكررة عشوائياً' };
  }

  // 3. Common keyboard mashes (e.g. "asdf", "asdasd", "qwerty", "zxcv", "ghjk")
  const keyboardMashes = [
    'asdf', 'asdasd', 'asd', 'qwerty', 'qwer', 'zxcv', 'ghjk',
    '123123', '12345', '123456', 'dfgh', 'jkl;', 'fghj', 'sdfsdf',
    'aaaa', 'bbbb', 'testtest', 'asdfgh'
  ];
  const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (keyboardMashes.some((m) => normalized === m || (normalized.length > 4 && normalized.includes('asdasd')))) {
    return { isSpam: true, reason: 'تسلسل مفاتيح عشوائي (Keyboard Mash)' };
  }

  // 4. Random english consonants with no vowels or space (length >= 5 and no vowels at all, e.g. "dfgkjh")
  if (normalized.length >= 5 && !/[aeiouy0-9]/i.test(normalized) && !title.includes(' ')) {
    return { isSpam: true, reason: 'حروف لاتينية عشوائية بدون أحرف علة' };
  }

  // 5. Pure random numbers without any word or context (e.g., "98723498234")
  if (/^\d{5,}$/.test(trimmed)) {
    return { isSpam: true, reason: 'أرقام عشوائية متتالية' };
  }

  return { isSpam: false };
}
