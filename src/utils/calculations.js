export const formatCurrency = (value) => {
  const num = Number(value || 0)
  return `৳ ${num.toLocaleString('en-BD', { maximumFractionDigits: 0 })}`
}

const safeNumber = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num) || num < 0) return 0
  return num
}

export const TRAVEL_ESTIMATE_ASSUMPTIONS = {
  travelers: 2,
  days: 2,
  maximumTravelers: 1000,
  maximumDays: 365,
  nights: 1,
  routeRoadFactor: 1.28,
  transportPerPassengerKm: { min: 2.5, max: 4.5 },
  foodPerPersonPerDay: { min: 400, max: 800 },
  localTransportPerPersonPerDay: { min: 200, max: 500 },
  otherPerPerson: { min: 400, max: 900 },
  accommodationPerRoomNight: { min: 1200, max: 3500 },
  destinationMultipliers: {
    standard: 1,
    coastal: 1.25,
    hill: 1.2,
  },
}

const TRAVEL_LOCATION_COORDINATES = {
  dhaka: { latitude: 23.8103, longitude: 90.4125 },
  chattogram: { latitude: 22.3569, longitude: 91.7832 },
  rajshahi: { latitude: 24.3745, longitude: 88.6042 },
  khulna: { latitude: 22.8456, longitude: 89.5403 },
  barishal: { latitude: 22.701, longitude: 90.3535 },
  sylhet: { latitude: 24.8949, longitude: 91.8687 },
  rangpur: { latitude: 25.7439, longitude: 89.2752 },
  mymensingh: { latitude: 24.7471, longitude: 90.4203 },
  patuakhali: { latitude: 22.3596, longitude: 90.3298 },
  kuakata: { latitude: 21.8167, longitude: 90.1167 },
  coxsbazar: { latitude: 21.4272, longitude: 92.0058 },
}

const DIVISION_CENTERS = {
  Dhaka: 'dhaka',
  Chattogram: 'chattogram',
  Rajshahi: 'rajshahi',
  Khulna: 'khulna',
  Barishal: 'barishal',
  Sylhet: 'sylhet',
  Rangpur: 'rangpur',
  Mymensingh: 'mymensingh',
}

const COASTAL_DESTINATIONS = new Set(['coxsbazar', 'kuakata', 'barguna', 'bhola', 'chandpur', 'noakhali', 'patuakhali'])
const HILL_DESTINATIONS = new Set(['bandarban', 'khagrachhari', 'rangamati'])

function haversineDistanceKm(start, end) {
  const radians = (degrees) => (degrees * Math.PI) / 180
  const latitudeDifference = radians(end.latitude - start.latitude)
  const longitudeDifference = radians(end.longitude - start.longitude)
  const a = Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(radians(start.latitude))
    * Math.cos(radians(end.latitude))
    * Math.sin(longitudeDifference / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function resolveTravelCoordinates(location) {
  const id = String(location?.id || '').toLocaleLowerCase()
  const directCoordinates = TRAVEL_LOCATION_COORDINATES[id]
  if (directCoordinates) return { coordinates: directCoordinates, usedDivisionCenter: false }

  const divisionCenterId = DIVISION_CENTERS[location?.divisionEnglish]
  return {
    coordinates: TRAVEL_LOCATION_COORDINATES[divisionCenterId] || TRAVEL_LOCATION_COORDINATES.dhaka,
    usedDivisionCenter: true,
  }
}

export function calculateAutomaticTravelEstimate({
  origin,
  destination,
  days = TRAVEL_ESTIMATE_ASSUMPTIONS.days,
  travelers = TRAVEL_ESTIMATE_ASSUMPTIONS.travelers,
}) {
  const start = resolveTravelCoordinates(origin)
  const end = resolveTravelCoordinates(destination)
  const distanceKm = haversineDistanceKm(start.coordinates, end.coordinates)
    * TRAVEL_ESTIMATE_ASSUMPTIONS.routeRoadFactor
  const safeDays = Math.min(
    TRAVEL_ESTIMATE_ASSUMPTIONS.maximumDays,
    Math.max(1, Math.round(safeNumber(days) || TRAVEL_ESTIMATE_ASSUMPTIONS.days)),
  )
  const safeTravelers = Math.min(
    TRAVEL_ESTIMATE_ASSUMPTIONS.maximumTravelers,
    Math.max(1, Math.round(safeNumber(travelers) || TRAVEL_ESTIMATE_ASSUMPTIONS.travelers)),
  )
  const nights = Math.max(safeDays - 1, 0)
  const rooms = Math.ceil(safeTravelers / 2)
  const destinationId = String(destination?.id || '').toLocaleLowerCase()
  const destinationType = COASTAL_DESTINATIONS.has(destinationId)
    ? 'coastal'
    : HILL_DESTINATIONS.has(destinationId) ? 'hill' : 'standard'
  const multiplier = TRAVEL_ESTIMATE_ASSUMPTIONS.destinationMultipliers[destinationType]
  const roundTripDistance = distanceKm * 2
  const breakdown = {
    transport: {
      min: roundTripDistance * TRAVEL_ESTIMATE_ASSUMPTIONS.transportPerPassengerKm.min * safeTravelers,
      max: roundTripDistance * TRAVEL_ESTIMATE_ASSUMPTIONS.transportPerPassengerKm.max * safeTravelers,
    },
    accommodation: {
      min: TRAVEL_ESTIMATE_ASSUMPTIONS.accommodationPerRoomNight.min * nights * rooms * multiplier,
      max: TRAVEL_ESTIMATE_ASSUMPTIONS.accommodationPerRoomNight.max * nights * rooms * multiplier,
    },
    food: {
      min: TRAVEL_ESTIMATE_ASSUMPTIONS.foodPerPersonPerDay.min * safeTravelers * safeDays * multiplier,
      max: TRAVEL_ESTIMATE_ASSUMPTIONS.foodPerPersonPerDay.max * safeTravelers * safeDays * multiplier,
    },
    localTransport: {
      min: TRAVEL_ESTIMATE_ASSUMPTIONS.localTransportPerPersonPerDay.min * safeTravelers * safeDays * multiplier,
      max: TRAVEL_ESTIMATE_ASSUMPTIONS.localTransportPerPersonPerDay.max * safeTravelers * safeDays * multiplier,
    },
    other: {
      min: TRAVEL_ESTIMATE_ASSUMPTIONS.otherPerPerson.min * safeTravelers * multiplier,
      max: TRAVEL_ESTIMATE_ASSUMPTIONS.otherPerPerson.max * safeTravelers * multiplier,
    },
  }

  const totals = Object.values(breakdown).reduce(
    (total, item) => ({ min: total.min + item.min, max: total.max + item.max }),
    { min: 0, max: 0 },
  )

  return {
    distanceKm: Math.round(distanceKm),
    distanceIsApproximate: start.usedDivisionCenter || end.usedDivisionCenter,
    destinationType,
    breakdown,
    total: totals,
    assumptions: { travelers: safeTravelers, days: safeDays, nights, rooms },
    perPerson: {
      min: totals.min / safeTravelers,
      max: totals.max / safeTravelers,
    },
  }
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
