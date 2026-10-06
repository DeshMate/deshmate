export const toolCatalog = [
  {
    id: 'construction',
    name: 'House Construction Cost',
    summary: 'Estimate home construction cost by area, floors and quality.',
    category: 'Life Tools',
  },
  {
    id: 'wedding',
    name: 'Wedding Budget',
    summary: 'Plan a wedding budget for guests, venue, food and more.',
    category: 'Life Tools',
  },
  {
    id: 'salary',
    name: 'Salary & Monthly Expense',
    summary: 'Track monthly income, costs and savings percentage.',
    category: 'Life Tools',
  },
  {
    id: 'car-emi',
    name: 'Car EMI',
    summary: 'Estimate a monthly EMI based on vehicle price and loan details.',
    category: 'Life Tools',
  },
  {
    id: 'bike-emi',
    name: 'Bike EMI',
    summary: 'Estimate a bike loan EMI using the same simple calculation model.',
    category: 'Life Tools',
  },
  {
    id: 'travel-budget',
    name: 'Travel Budget',
    summary: 'Estimate travel costs for a group trip by day and destination.',
    category: 'Life Tools',
  },
  {
    id: 'abroad-cost',
    name: 'Abroad Cost Planner',
    summary: 'Plan likely costs for moving, visa and travel abroad.',
    category: 'Life Tools',
  },
  {
    id: 'japan-cost',
    name: 'Japan Cost Planner',
    summary: 'Estimate language course, visa, flight and living costs.',
    category: 'Life Tools',
  },
  {
    id: 'kuwait-cost',
    name: 'Kuwait Cost Planner',
    summary: 'Estimate working or move-related expenses for Kuwait.',
    category: 'Life Tools',
  },
  {
    id: 'electricity',
    name: 'Electricity Calculator',
    summary: 'Estimate daily and monthly power consumption from appliances.',
    category: 'Life Tools',
  },
  {
    id: 'education',
    name: 'Education Cost',
    summary: 'Estimate education costs by course length and category.',
    category: 'Life Tools',
  },
]

export const searchIndex = [
  ...toolCatalog.map((tool) => ({
    type: 'Tool',
    itemId: tool.id,
    label: tool.name,
    description: tool.summary,
  })),
]
