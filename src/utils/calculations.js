export const formatCurrency = (value) => {
  const num = Number(value || 0)
  return `৳ ${num.toLocaleString('en-BD', { maximumFractionDigits: 0 })}`
}

const safeNumber = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num) || num < 0) return 0
  return num
}

export function calculateEMI(vehiclePrice, downPayment, loanDurationMonths, interestRateAnnual) {
  const principal = safeNumber(vehiclePrice) - safeNumber(downPayment)
  const months = Math.max(safeNumber(loanDurationMonths), 1)
  const annualRate = safeNumber(interestRateAnnual)
  const monthlyRate = annualRate / 12 / 100

  if (principal <= 0) return 0
  if (monthlyRate === 0) return principal / months

  const powerTerm = Math.pow(1 + monthlyRate, months)
  return (principal * monthlyRate * powerTerm) / (powerTerm - 1)
}

export function calculateTravelBudget({ transport = 0, hotel = 0, food = 0, activities = 0, other = 0 }) {
  const result = {
    transport: safeNumber(transport),
    hotel: safeNumber(hotel),
    food: safeNumber(food),
    activities: safeNumber(activities),
    other: safeNumber(other),
  }

  result.grandTotal = Object.values(result).reduce((sum, v) => sum + v, 0)
  return result
}

export function calculateWeddingBudget({
  guests = 0,
  venue = 0,
  foodPerPerson = 0,
  decoration = 0,
  photography = 0,
  clothing = 0,
  transport = 0,
  other = 0,
}) {
  const foodTotal = safeNumber(guests) * safeNumber(foodPerPerson)
  return {
    food: foodTotal,
    venue: safeNumber(venue),
    decoration: safeNumber(decoration),
    photography: safeNumber(photography),
    clothing: safeNumber(clothing),
    transport: safeNumber(transport),
    other: safeNumber(other),
    total: foodTotal + safeNumber(venue) + safeNumber(decoration) + safeNumber(photography) + safeNumber(clothing) + safeNumber(transport) + safeNumber(other),
  }
}

export function calculateHouseCost({ area = 0, floors = 1, quality = 'Standard' }) {
  const floorCount = Math.max(safeNumber(floors), 1)
  const sqFeet = safeNumber(area)
  const rateMap = {
    Basic: 850,
    Standard: 1300,
    Premium: 1900,
  }

  const base = sqFeet * floorCount * (rateMap[quality] || rateMap.Standard)
  return {
    min: base * 0.85,
    avg: base,
    max: base * 1.15,
  }
}

export function calculateSalaryExpense({
  monthlyIncome = 0,
  houseRent = 0,
  food = 0,
  transport = 0,
  utilities = 0,
  family = 0,
  education = 0,
  loan = 0,
  other = 0,
}) {
  const income = safeNumber(monthlyIncome)
  const expenseTotal = safeNumber(houseRent) + safeNumber(food) + safeNumber(transport) + safeNumber(utilities) + safeNumber(family) + safeNumber(education) + safeNumber(loan) + safeNumber(other)
  const remaining = income - expenseTotal
  const savingsPercentage = income > 0 ? (remaining / income) * 100 : 0

  return {
    totalExpense: expenseTotal,
    remainingMoney: remaining,
    savingsPercentage,
  }
}

export function calculateElectricityUsage(appliances = []) {
  const totalWatts = appliances.reduce((sum, item) => {
    const watts = safeNumber(item.wattage)
    const hours = safeNumber(item.hours)
    const quantity = safeNumber(item.quantity)
    return sum + watts * hours * quantity
  }, 0)

  const dailyKWh = totalWatts / 1000
  const monthlyKWh = dailyKWh * 30

  return {
    dailyKWh,
    monthlyKWh,
  }
}

export function calculateEducationCost({
  duration = 0,
  tuition = 0,
  books = 0,
  transport = 0,
  accommodation = 0,
  other = 0,
}) {
  const total = safeNumber(tuition) + safeNumber(books) + safeNumber(transport) + safeNumber(accommodation) + safeNumber(other)
  return {
    duration: safeNumber(duration),
    total,
  }
}

export function calculateAbroadCost({ visa = 0, travel = 0, accommodation = 0, documents = 0, medical = 0, other = 0 }) {
  return {
    total: safeNumber(visa) + safeNumber(travel) + safeNumber(accommodation) + safeNumber(documents) + safeNumber(medical) + safeNumber(other),
  }
}

export function calculateJapanCost({ languageCourse = 0, visa = 0, flight = 0, medical = 0, documents = 0, accommodation = 0, food = 0, transport = 0, other = 0 }) {
  return {
    total: safeNumber(languageCourse) + safeNumber(visa) + safeNumber(flight) + safeNumber(medical) + safeNumber(documents) + safeNumber(accommodation) + safeNumber(food) + safeNumber(transport) + safeNumber(other),
  }
}

export function calculateKuwaitCost({ visa = 0, travel = 0, accommodation = 0, documents = 0, medical = 0, other = 0 }) {
  return {
    total: safeNumber(visa) + safeNumber(travel) + safeNumber(accommodation) + safeNumber(documents) + safeNumber(medical) + safeNumber(other),
  }
}

export function calculateTravelPlanner(values) {
  return {
    transport: safeNumber(values.transport),
    hotel: safeNumber(values.hotel),
    food: safeNumber(values.foodBudget),
    localTransport: safeNumber(values.localTransport),
    activities: safeNumber(values.activities),
    other: safeNumber(values.otherExpenses),
  }
}
