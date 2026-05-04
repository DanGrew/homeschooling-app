export const CM_COLOURS={
  red:            {hex:'#E74C3C',label:'Red'},
  yellow:         {hex:'#F1C40F',label:'Yellow'},
  blue:           {hex:'#3498DB',label:'Blue'},
  orange:         {hex:'#E67E22',label:'Orange'},
  green:          {hex:'#2ECC71',label:'Green'},
  purple:         {hex:'#9B59B6',label:'Purple'},
  'red-orange':   {hex:'#E8562A',label:'Red-Orange'},
  'yellow-orange':{hex:'#F4A228',label:'Yellow-Orange'},
  'yellow-green': {hex:'#95C23C',label:'Yellow-Green'},
  'blue-green':   {hex:'#1AAD8E',label:'Blue-Green'},
  'blue-purple':  {hex:'#6A64B8',label:'Blue-Purple'},
  'red-purple':   {hex:'#C03890',label:'Red-Purple'},
  'red-green-mix':    {hex:'#6B5030',label:'Brown'},
  'yellow-purple-mix':{hex:'#7A6A30',label:'Brown'},
  'blue-orange-mix':  {hex:'#5A5A50',label:'Grey'},
  'orange-green-mix': {hex:'#7A7A25',label:'Olive'},
  'orange-purple-mix':{hex:'#7A3A20',label:'Brown'},
  'green-purple-mix': {hex:'#3A5A50',label:'Dark Green'}
};

export const CM_MIXES={
  'red+yellow':'orange',              'yellow+red':'orange',
  'red+blue':'purple',                'blue+red':'purple',
  'blue+yellow':'green',              'yellow+blue':'green',
  'red+orange':'red-orange',          'orange+red':'red-orange',
  'yellow+orange':'yellow-orange',    'orange+yellow':'yellow-orange',
  'yellow+green':'yellow-green',      'green+yellow':'yellow-green',
  'blue+green':'blue-green',          'green+blue':'blue-green',
  'blue+purple':'blue-purple',        'purple+blue':'blue-purple',
  'red+purple':'red-purple',          'purple+red':'red-purple',
  'red+green':'red-green-mix',        'green+red':'red-green-mix',
  'yellow+purple':'yellow-purple-mix','purple+yellow':'yellow-purple-mix',
  'blue+orange':'blue-orange-mix',    'orange+blue':'blue-orange-mix',
  'orange+green':'orange-green-mix',  'green+orange':'orange-green-mix',
  'orange+purple':'orange-purple-mix','purple+orange':'orange-purple-mix',
  'green+purple':'green-purple-mix',  'purple+green':'green-purple-mix'
};

export function mix(a,b){if(a===b)return a;return CM_MIXES[a+'+'+b]||null;}
export function hex(id){return CM_COLOURS[id]?CM_COLOURS[id].hex:'#f0f0f0';}
