// Utility functions for testing and debugging similarity detection

export const testSimilarityExamples = () => {
  const examples = [
    {
      name: "Exact ISBN Match",
      book1: { title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "978-0743273565" },
      book2: { title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "978-0743273565" },
      expectedScore: 1.0
    },
    {
      name: "ISBN-10 vs ISBN-13",
      book1: { title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "0743273567" },
      book2: { title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "978-0743273565" },
      expectedScore: 0.95
    },
    {
      name: "Different Editions",
      book1: { title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "978-0743273565" },
      book2: { title: "The Great Gatsby (Special Edition)", author: "F. Scott Fitzgerald", isbn: "978-0743273566" },
      expectedScore: 0.8
    },
    {
      name: "Same Author, Similar Title",
      book1: { title: "The Hobbit", author: "J.R.R. Tolkien", isbn: "978-0547928241" },
      book2: { title: "The Hobbit: An Unexpected Journey", author: "J.R.R. Tolkien", isbn: "978-0547928242" },
      expectedScore: 0.7
    },
    {
      name: "Different Authors",
      book1: { title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "978-0743273565" },
      book2: { title: "The Great Gatsby", author: "Ernest Hemingway", isbn: "978-0743273566" },
      expectedScore: 0.3
    }
  ]
  
  return examples
}

export const normalizeTitle = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

export const normalizeAuthor = (author: string): string => {
  return author
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export const compareTitles = (title1: string, title2: string): number => {
  const norm1 = normalizeTitle(title1)
  const norm2 = normalizeTitle(title2)
  
  if (norm1 === norm2) return 1.0
  
  // Split into words
  const words1 = norm1.split(' ').filter(w => w.length > 2)
  const words2 = norm2.split(' ').filter(w => w.length > 2)
  
  if (words1.length === 0 || words2.length === 0) return 0
  
  // Calculate word overlap
  const commonWords = words1.filter(word => words2.includes(word))
  const totalWords = Math.max(words1.length, words2.length)
  
  const wordOverlap = commonWords.length / totalWords
  
  // Check for edition indicators
  const editionWords = ['edition', 'ed', 'version', 'revised', 'updated', 'new', 'special', 'collector']
  const hasEdition1 = editionWords.some(word => norm1.includes(word))
  const hasEdition2 = editionWords.some(word => norm2.includes(word))
  
  // If both have edition words, boost similarity
  if (hasEdition1 && hasEdition2) {
    return Math.min(1.0, wordOverlap + 0.2)
  }
  
  return wordOverlap
}

export const compareAuthors = (author1: string, author2: string): number => {
  const norm1 = normalizeAuthor(author1)
  const norm2 = normalizeAuthor(author2)
  
  if (norm1 === norm2) return 1.0
  
  // Split into name parts
  const parts1 = norm1.split(' ')
  const parts2 = norm2.split(' ')
  
  // Check for exact match
  if (parts1.join(' ') === parts2.join(' ')) return 1.0
  
  // Check for reversed names (e.g., "John Smith" vs "Smith, John")
  if (parts1.length === 2 && parts2.length === 2) {
    if (parts1[0] === parts2[1] && parts1[1] === parts2[0]) return 0.9
  }
  
  // Check for partial matches (first name or last name)
  const commonParts = parts1.filter(part => parts2.includes(part))
  if (commonParts.length > 0) {
    return commonParts.length / Math.max(parts1.length, parts2.length)
  }
  
  return 0
}

export const compareISBNs = (isbn1: string, isbn2: string): number => {
  const clean1 = isbn1.replace(/[^\dX]/gi, '')
  const clean2 = isbn2.replace(/[^\dX]/gi, '')
  
  if (clean1 === clean2) return 1.0
  
  // Check if one is ISBN-10 and other is ISBN-13 of same book
  if (clean1.length === 10 && clean2.length === 13) {
    // Convert ISBN-10 to ISBN-13 and compare
    const converted = convertISBN10To13(clean1)
    if (converted === clean2) return 0.95
  } else if (clean1.length === 13 && clean2.length === 10) {
    const converted = convertISBN10To13(clean2)
    if (converted === clean1) return 0.95
  }
  
  return 0
}

export const convertISBN10To13 = (isbn10: string): string => {
  // Simple conversion: add 978 prefix and recalculate check digit
  const prefix = '978'
  const body = isbn10.slice(0, 9)
  const isbn13 = prefix + body
  
  // Calculate check digit for ISBN-13
  let sum = 0
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(isbn13[i])
    sum += digit * (i % 2 === 0 ? 1 : 3)
  }
  const checkDigit = (10 - (sum % 10)) % 10
  
  return isbn13 + checkDigit
}

export const calculateSimilarityScore = (book1: any, book2: any): number => {
  let totalScore = 0
  let maxScore = 0
  
  // ISBN comparison (highest weight - 40%)
  if (book1.isbn && book2.isbn) {
    const isbnScore = compareISBNs(book1.isbn, book2.isbn)
    totalScore += isbnScore * 0.4
    maxScore += 0.4
  }
  
  // Title comparison (30% weight)
  if (book1.title && book2.title) {
    const titleScore = compareTitles(book1.title, book2.title)
    totalScore += titleScore * 0.3
    maxScore += 0.3
  }
  
  // Author comparison (20% weight)
  if (book1.author && book2.author) {
    const authorScore = compareAuthors(book1.author, book2.author)
    totalScore += authorScore * 0.2
    maxScore += 0.2
  }
  
  // Publisher comparison (10% weight)
  if (book1.publisher && book2.publisher) {
    const publisherScore = comparePublishers(book1.publisher, book2.publisher)
    totalScore += publisherScore * 0.1
    maxScore += 0.1
  }
  
  return maxScore > 0 ? totalScore / maxScore : 0
}

export const comparePublishers = (pub1: string, pub2: string): number => {
  const norm1 = pub1.toLowerCase().replace(/[^\w\s]/g, '').trim()
  const norm2 = pub2.toLowerCase().replace(/[^\w\s]/g, '').trim()
  
  if (norm1 === norm2) return 1.0
  
  // Check for partial matches
  const words1 = norm1.split(' ')
  const words2 = norm2.split(' ')
  const commonWords = words1.filter(word => words2.includes(word))
  
  if (commonWords.length > 0) {
    return commonWords.length / Math.max(words1.length, words2.length)
  }
  
  return 0
} 