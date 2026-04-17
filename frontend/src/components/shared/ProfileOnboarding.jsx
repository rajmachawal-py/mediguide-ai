/**
 * MediGuide AI — Profile Onboarding
 * Full-screen modal shown after signup when user hasn't filled required profile fields.
 * Cannot be dismissed — user MUST fill name, age, gender before using the app.
 *
 * Auto-fills the name field from the user's email when possible.
 * Edge cases (gibberish emails, numbers-only, etc.) leave the field empty.
 */

import { useState, useEffect } from 'react'
import { FiUser, FiLoader, FiArrowRight } from 'react-icons/fi'
import { useLanguage } from '../../contexts/LanguageContext'
import { updateProfile } from '../../services/api'
import { supabase } from '../../services/supabase'
import toast from 'react-hot-toast'

/**
 * Curated set of common first names (Indian + international).
 * Used to validate whether an email local-part contains a real name.
 * Only emails with ALL parts matching known names will be auto-filled.
 *
 * This prevents gibberish like "mujhepechano", "coolguy99", "abc" etc.
 * from being treated as valid names.
 */
const KNOWN_FIRST_NAMES = new Set([
  // ── Indian Male Names ──────────────────────────────────────────
  'aarav', 'aakash', 'aakesh', 'aadil', 'aadi', 'aadit', 'aaditya', 'aahan',
  'abhay', 'abhi', 'abhijit', 'abhijeet', 'abhilash', 'abhimanyu', 'abhinav',
  'abhishek', 'achyut', 'adarsh', 'aditya', 'advik', 'agastya', 'ajay',
  'ajit', 'ajeet', 'akash', 'akhil', 'akshay', 'akshat', 'alok', 'aman',
  'amar', 'amarjeet', 'ambar', 'amit', 'amitabh', 'amol', 'amrit', 'anand',
  'anas', 'aniket', 'anil', 'animesh', 'anirudh', 'anish', 'anjum', 'ankit',
  'ankur', 'anoop', 'ansh', 'anshu', 'anshul', 'anuj', 'anurag', 'apoorv',
  'arjun', 'arnav', 'arun', 'arvind', 'aryan', 'ashish', 'ashok', 'ashraf',
  'ashwin', 'asif', 'atharv', 'atul', 'avnish', 'ayaan', 'ayush',
  'balraj', 'baljeet', 'bharat', 'bhaskar', 'bhuvan', 'bikram', 'bipin',
  'chaitanya', 'chandan', 'chandresh', 'chirag', 'chitransh',
  'daksh', 'darshan', 'dayanand', 'deep', 'deepak', 'dev', 'devang',
  'devendra', 'deven', 'dhruv', 'dilip', 'dinesh', 'divyansh', 'divyanshu',
  'ekansh', 'eklavya',
  'farhan', 'faisal', 'faiz',
  'gagan', 'ganesh', 'gaurav', 'gautam', 'girish', 'gopal', 'govind',
  'guhan', 'gulshan', 'gunjan', 'gurpreet',
  'hardik', 'hari', 'harish', 'harman', 'harnoor', 'harsh', 'harshad',
  'harshit', 'hasan', 'hemant', 'himanshu', 'hitesh', 'hriday', 'hrithik',
  'ishan', 'ishaan', 'imran',
  'jagdish', 'jai', 'jatin', 'jay', 'jayant', 'jayesh', 'jigar',
  'jitendra', 'jitesh', 'joginder',
  'kabir', 'kailash', 'kamal', 'karan', 'kartik', 'karthik', 'kashyap',
  'keshav', 'kishore', 'krishna', 'krish', 'kunal', 'kundan',
  'lakshay', 'lakshman', 'lalit', 'lavish', 'lokesh',
  'madhav', 'madan', 'mahesh', 'manav', 'manish', 'manoj', 'mayank',
  'mihir', 'milan', 'mohit', 'mohan', 'mukesh', 'mukul', 'mridul',
  'nachiket', 'naman', 'nand', 'naresh', 'narendra', 'naveen', 'navin',
  'neeraj', 'nihal', 'nikhil', 'nilesh', 'nishant', 'nishith', 'nitesh',
  'nitin', 'nityam',
  'om', 'omkar', 'onkar',
  'pankaj', 'param', 'paras', 'parth', 'pavan', 'piyush', 'pradeep',
  'pradyumn', 'prakash', 'pramod', 'pranav', 'pranay', 'pranjal',
  'prasad', 'prashant', 'pratap', 'pratham', 'pratik', 'pratyush',
  'praveen', 'prem', 'prithvi', 'priyanshu', 'pulkit', 'puneet', 'pushkar',
  'raghav', 'rahul', 'raj', 'rajat', 'rajeev', 'rajesh', 'rajiv',
  'rakesh', 'ram', 'raman', 'ramesh', 'ranbir', 'ranveer', 'rashi',
  'ratan', 'ravi', 'rehan', 'rishabh', 'rishab', 'rishi', 'ritesh',
  'ritik', 'rohit', 'ronak', 'roshan', 'rudra',
  'sachin', 'saket', 'sameer', 'samir', 'sandeep', 'sanjay', 'sanjiv',
  'sankalp', 'sarthak', 'satish', 'saurabh', 'shaan', 'shahid',
  'shailesh', 'sharad', 'shashank', 'shekhar', 'shivam', 'shiv',
  'shreyas', 'shubham', 'siddharth', 'siddhant', 'sourav', 'srinivas',
  'subhash', 'sudhir', 'suhas', 'sujit', 'sumit', 'sunil', 'sunny',
  'suraj', 'suresh', 'surya', 'sushil', 'swapnil',
  'tanmay', 'tarun', 'tejas', 'trilok', 'tushar',
  'uday', 'ujjwal', 'umesh', 'utkarsh',
  'vaibhav', 'varun', 'ved', 'venkat', 'vibhor', 'vijay', 'vikas',
  'vikram', 'vikrant', 'vinay', 'vineet', 'vinod', 'vipin', 'viraj',
  'virat', 'vishnu', 'vishal', 'vivek', 'vyas',
  'yash', 'yashraj', 'yogesh', 'yuvan', 'yuvraj',
  'zaheer', 'zakir', 'zubin',

  // ── Indian Female Names ────────────────────────────────────────
  'aanya', 'aarti', 'aashi', 'aashna', 'aditi', 'ahana', 'aisha', 'akshita',
  'amisha', 'amrita', 'ananya', 'angel', 'anika', 'anita', 'anjali',
  'ankita', 'anushka', 'aparna', 'archana', 'arpita', 'arushi', 'avni',
  'bhavna', 'bhavya', 'bhumika',
  'charu', 'chetna',
  'damini', 'deeya', 'deepa', 'deepika', 'devi', 'devika', 'disha',
  'divya', 'durga',
  'ekta', 'esha',
  'garima', 'gauri', 'gayatri', 'geeta', 'gita',
  'hema', 'hina', 'isha',
  'jaya', 'jayanti', 'jyoti', 'juhi',
  'kajal', 'kamini', 'kanchan', 'kavita', 'kavya', 'kiran', 'kirti',
  'komal', 'kriti', 'kritika', 'kumari',
  'lata', 'lavanya', 'laxmi', 'leela',
  'madhu', 'madhuri', 'mahima', 'mamta', 'manisha', 'manju', 'maya',
  'mayuri', 'meena', 'meenakshi', 'megha', 'minal', 'mira', 'monika',
  'mridula', 'muskan', 'mythili',
  'nalini', 'namita', 'nandini', 'neelam', 'neeha', 'neha', 'nikita',
  'nisha', 'nidhi', 'nimisha', 'nitya', 'nupur',
  'padma', 'pallavi', 'paridhi', 'parul', 'pooja', 'poonam', 'pragya',
  'prachi', 'pragati', 'prarthana', 'prerna', 'priti', 'priya', 'priyanka',
  'rachna', 'radha', 'ragini', 'ranjana', 'rashmi', 'raveena', 'reema',
  'rekha', 'renuka', 'rhea', 'richa', 'ridhi', 'rima', 'rina', 'ritu',
  'riya', 'rohini', 'roshni', 'ruchi', 'rupali',
  'sakshi', 'sandhya', 'sangita', 'sanjana', 'sapna', 'sarika', 'sarita',
  'savita', 'seema', 'shabnam', 'shakti', 'shalu', 'shanti', 'shikha',
  'shipra', 'shivani', 'shobha', 'shreya', 'smita', 'smriti', 'sneha',
  'sonia', 'sonali', 'sonam', 'sudha', 'sujata', 'sulekha', 'sunita',
  'surbhi', 'sushma', 'swati', 'sweta',
  'tanvi', 'tanya', 'tara', 'trisha',
  'uma', 'urvashi', 'usha',
  'vandana', 'vaishali', 'varsha', 'vidya', 'vimala', 'vineeta',
  'yamini', 'yasmin', 'yukta',
  'zara', 'zoya',

  // ── International Male Names ───────────────────────────────────
  'aaron', 'adam', 'adrian', 'aiden', 'alan', 'albert', 'alex', 'alexander',
  'alfred', 'ali', 'allen', 'andrew', 'andy', 'anthony', 'antonio', 'archie',
  'arthur', 'austin',
  'barry', 'ben', 'benjamin', 'bernard', 'blake', 'bobby', 'brad', 'bradley',
  'brandon', 'brian', 'bruce', 'bryan',
  'caleb', 'calvin', 'cameron', 'carl', 'carlos', 'carter', 'charles',
  'charlie', 'chase', 'chris', 'christian', 'christopher', 'clarence',
  'clark', 'clinton', 'cole', 'colin', 'connor', 'corey', 'craig', 'curtis',
  'dale', 'damian', 'dan', 'daniel', 'danny', 'darren', 'dave', 'david',
  'dean', 'dennis', 'derek', 'diego', 'dominic', 'donald', 'douglas', 'drew',
  'duncan', 'dustin', 'dylan',
  'earl', 'eddie', 'edgar', 'edward', 'eli', 'elijah', 'elliot', 'elliott',
  'eric', 'erik', 'ernest', 'ethan', 'eugene', 'evan',
  'felix', 'finley', 'finn', 'francis', 'frank', 'franklin', 'fred',
  'frederick',
  'gabriel', 'garrett', 'gary', 'gene', 'george', 'gerald', 'glen', 'glenn',
  'gordon', 'graham', 'grant', 'greg', 'gregory', 'gus', 'guy',
  'hank', 'harold', 'harry', 'harvey', 'hayden', 'henry', 'herbert',
  'howard', 'hudson', 'hugh', 'hugo', 'hunter',
  'ian', 'isaac', 'ivan',
  'jack', 'jackson', 'jacob', 'jake', 'james', 'jamie', 'jared', 'jason',
  'jasper', 'jeff', 'jeffrey', 'jeremy', 'jerome', 'jesse', 'jimmy', 'joe',
  'joel', 'john', 'johnny', 'jonas', 'jonathan', 'jordan', 'jorge', 'jose',
  'joseph', 'josh', 'joshua', 'juan', 'julian', 'justin',
  'karl', 'keith', 'ken', 'kenneth', 'kevin', 'kirk', 'kurt', 'kyle',
  'lance', 'larry', 'lawrence', 'lee', 'leon', 'leonard', 'leo', 'levi',
  'lewis', 'liam', 'lincoln', 'logan', 'louis', 'luca', 'lucas', 'luke',
  'malcolm', 'marcus', 'mark', 'marshall', 'martin', 'mason', 'mathew',
  'matthew', 'max', 'maxwell', 'michael', 'miguel', 'miles', 'mitchell',
  'mohammed', 'morgan', 'muhammad',
  'nathan', 'neil', 'nelson', 'nicholas', 'nick', 'noah', 'noel', 'norman',
  'oliver', 'omar', 'oscar', 'owen',
  'patrick', 'paul', 'pedro', 'peter', 'philip', 'phillip', 'pierce',
  'quinn',
  'rafael', 'ralph', 'ramon', 'randy', 'raymond', 'reginald', 'richard',
  'rick', 'riley', 'robert', 'robin', 'rodrigo', 'roger', 'roland',
  'roman', 'ronald', 'ross', 'roy', 'ruben', 'russell', 'ryan',
  'sam', 'samuel', 'santiago', 'scott', 'sean', 'sebastian', 'seth',
  'shane', 'shawn', 'simon', 'spencer', 'stanley', 'stefan', 'stephen',
  'steve', 'steven', 'stuart', 'syed',
  'ted', 'terry', 'theodore', 'thomas', 'tim', 'timothy', 'todd', 'tom',
  'tony', 'travis', 'trevor', 'troy', 'tyler',
  'victor', 'vincent', 'virgil',
  'wade', 'walter', 'warren', 'wayne', 'wesley', 'william', 'willie',
  'wyatt',
  'xavier',
  'zachary', 'zane',

  // ── International Female Names ─────────────────────────────────
  'abigail', 'addison', 'adriana', 'alexandra', 'alexis', 'alice', 'alicia',
  'allison', 'alyssa', 'amanda', 'amber', 'amelia', 'amy', 'andrea',
  'angela', 'angelina', 'ann', 'anna', 'anne', 'annie', 'ariana',
  'ashley', 'audrey', 'aurora', 'autumn', 'ava',
  'bailey', 'barbara', 'beatrice', 'bella', 'beth', 'betty', 'beverly',
  'bianca', 'bonnie', 'brenda', 'brianna', 'brittany', 'brooke',
  'camila', 'candace', 'carla', 'carmen', 'carol', 'caroline', 'carolyn',
  'catherine', 'charlotte', 'chelsea', 'cheryl', 'chloe', 'christina',
  'christine', 'cindy', 'claire', 'clara', 'claudia', 'colleen', 'connie',
  'courtney', 'crystal', 'cynthia',
  'daisy', 'dana', 'danielle', 'daphne', 'dawn', 'deborah', 'debra',
  'delilah', 'denise', 'diana', 'diane', 'dolores', 'donna', 'dorothy',
  'edith', 'elaine', 'eleanor', 'elena', 'elise', 'elizabeth', 'ella',
  'ellen', 'ellie', 'emily', 'emma', 'erica', 'erin', 'esther', 'eva',
  'evelyn',
  'faith', 'fatima', 'felicity', 'fiona', 'florence', 'frances',
  'gabriella', 'gail', 'gemma', 'georgia', 'geraldine', 'gina', 'gloria',
  'grace', 'gwen',
  'hailey', 'hannah', 'harper', 'harriet', 'hazel', 'heather', 'heidi',
  'helen', 'holly', 'hope',
  'irene', 'iris', 'isabella', 'isla', 'ivy',
  'jacqueline', 'jade', 'jane', 'janet', 'janice', 'jasmine', 'jean',
  'jenna', 'jennifer', 'jessica', 'jill', 'joan', 'joanna', 'jocelyn',
  'jodie', 'josephine', 'joyce', 'judith', 'judy', 'julia', 'julie',
  'june', 'justine',
  'kaitlyn', 'karen', 'kate', 'katherine', 'kathleen', 'kathryn',
  'katie', 'kayla', 'kelly', 'kimberly', 'kristen', 'kristin', 'kristina',
  'laura', 'lauren', 'layla', 'leah', 'leigh', 'leslie', 'lillian',
  'lily', 'linda', 'lisa', 'lois', 'lorraine', 'louise', 'lucia', 'lucy',
  'lydia', 'lynn',
  'mackenzie', 'madeline', 'madison', 'maggie', 'margaret', 'maria',
  'mariam', 'marilyn', 'marissa', 'martha', 'mary', 'megan', 'melanie',
  'melissa', 'melody', 'mia', 'michelle', 'miley', 'miranda', 'molly',
  'monica', 'morgan', 'myrtle',
  'naomi', 'natalie', 'natasha', 'nicole', 'nina', 'nora',
  'olivia',
  'paige', 'pamela', 'patricia', 'paula', 'pauline', 'penelope', 'penny',
  'phoebe', 'phyllis', 'piper',
  'rachel', 'rebecca', 'regina', 'renee', 'riley', 'rita', 'roberta',
  'rosa', 'rose', 'rosemary', 'ruby', 'ruth',
  'sabrina', 'sadie', 'sally', 'samantha', 'sandra', 'sara', 'sarah',
  'savannah', 'scarlett', 'selena', 'serena', 'shannon', 'sharon', 'sheila',
  'shirley', 'sierra', 'skylar', 'sofia', 'sophia', 'sophie', 'stacy',
  'stella', 'stephanie', 'susan', 'suzanne', 'sylvia',
  'tamara', 'tammy', 'tatiana', 'taylor', 'teresa', 'tessa', 'tiffany',
  'tina', 'tracy', 'trinity',
  'ursula',
  'valentina', 'valerie', 'vanessa', 'vera', 'veronica', 'victoria',
  'violet', 'virginia', 'vivian',
  'wendy', 'whitney', 'willow',
  'yolanda', 'yvonne',
  'zoe', 'zoey',

  // ── Common surnames that also appear as email local-parts ──────
  'sharma', 'gupta', 'patel', 'singh', 'kumar', 'verma', 'joshi', 'khan',
  'mehta', 'reddy', 'nair', 'menon', 'iyer', 'iyengar', 'rao', 'murthy',
  'bhat', 'pillai', 'kaur', 'gill', 'malhotra', 'kapoor', 'chopra',
  'arora', 'bose', 'sen', 'das', 'dutta', 'ghosh', 'roy', 'mukherjee',
  'banerjee', 'chatterjee', 'mishra', 'pandey', 'dubey', 'tiwari',
  'srivastava', 'yadav', 'thakur', 'chauhan', 'rajput', 'saxena',
  'agarwal', 'jain', 'shah', 'desai', 'patil', 'kulkarni', 'deshpande',
  'bhatt', 'trivedi', 'shukla', 'dwivedi', 'mathur', 'chandra',
  'smith', 'johnson', 'williams', 'brown', 'jones', 'garcia', 'miller',
  'davis', 'wilson', 'moore', 'anderson', 'taylor', 'jackson', 'white',
  'harris', 'martin', 'thompson', 'martinez', 'robinson', 'clark',
  'lewis', 'walker', 'hall', 'allen', 'young', 'king', 'wright',
  'scott', 'green', 'baker', 'adams', 'nelson', 'hill', 'campbell',
  'mitchell', 'roberts', 'carter', 'phillips', 'evans', 'turner',
  'torres', 'parker', 'collins', 'edwards', 'stewart', 'morris',
  'murphy', 'cook', 'rogers', 'morgan', 'peterson', 'cooper', 'reed',
  'bailey', 'bell', 'howard', 'ward', 'cox', 'diaz', 'richardson',
  'wood', 'watson', 'brooks', 'bennett', 'gray', 'james', 'reyes',
  'cruz', 'hughes', 'price', 'myers', 'long', 'foster', 'sanders',
  'ross', 'powell', 'sullivan', 'russell', 'ortiz', 'jenkins', 'perry',
  'butler', 'barnes', 'fisher',
])

/**
 * Attempt to extract a human-readable name from an email address.
 * Returns a properly capitalised name string, or '' if the email
 * doesn't contain a recognisable real name.
 *
 * Uses a curated dictionary of common first names + surnames.
 * ALL extracted parts must match known names for auto-fill to work.
 *
 * Examples:
 *   "john.doe@gmail.com"      → "John Doe"          ✓ both parts are known names
 *   "rajesh.sharma@yahoo.com" → "Rajesh Sharma"      ✓ both parts are known names
 *   "priya@company.in"        → "Priya"              ✓ single known name
 *   "abc@gmail.com"           → ""                   ✗ not a known name
 *   "mujhepechano@gmail.com"  → ""                   ✗ not a known name
 *   "coolguy99@gmail.com"     → ""                   ✗ not a known name
 *   "12345@gmail.com"         → ""                   ✗ numbers only
 *   "info@company.com"        → ""                   ✗ generic prefix
 */
function extractNameFromEmail(email) {
  if (!email || typeof email !== 'string') return ''

  const localPart = email.split('@')[0]
  if (!localPart) return ''

  // Reject if the local part is purely numeric (e.g. "12345@gmail.com")
  if (/^\d+$/.test(localPart)) return ''

  // Split by common separators: dots, underscores, hyphens
  const parts = localPart
    .split(/[._-]+/)
    .map(p => p.replace(/\d+/g, '').trim().toLowerCase())  // strip digits, normalise
    .filter(p => p.length > 0)

  if (parts.length === 0) return ''

  // Generic / non-name prefixes to reject
  const genericPrefixes = new Set([
    'info', 'admin', 'contact', 'support', 'hello', 'hi', 'hey',
    'mail', 'email', 'test', 'user', 'noreply', 'noreply',
    'sales', 'help', 'office', 'team', 'service', 'webmaster',
    'manager', 'official', 'staff', 'dev', 'demo', 'temp',
    'root', 'sysadmin', 'postmaster', 'hostmaster',
  ])

  // Reject if any part is a generic/functional prefix
  if (parts.some(p => genericPrefixes.has(p))) return ''

  // ── Core validation: every part must be a known name ──
  const recognisedParts = parts.filter(p => KNOWN_FIRST_NAMES.has(p))

  // If none of the parts are recognised names → empty
  if (recognisedParts.length === 0) return ''

  // If some parts matched but others didn't, only use the recognised ones
  // (handles cases like "john123" → ["john"] after digit stripping)
  // But if the original had multiple parts and less than half matched, reject
  if (parts.length > 1 && recognisedParts.length < Math.ceil(parts.length / 2)) return ''

  // Capitalise each part
  const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()

  // Build the final name (max 3 parts to avoid absurdly long names)
  const finalName = recognisedParts.slice(0, 3).map(capitalise).join(' ')

  // Final sanity: name should be at least 2 characters
  if (finalName.replace(/\s/g, '').length < 2) return ''

  return finalName
}

const t = {
  hi: {
    title: 'अपनी जानकारी भरें',
    subtitle: 'बेहतर स्वास्थ्य सहायता के लिए ये जानकारी ज़रूरी है',
    name: 'पूरा नाम',
    namePlaceholder: 'आपका नाम',
    age: 'उम्र',
    agePlaceholder: 'जैसे 30',
    gender: 'लिंग',
    male: 'पुरुष',
    female: 'महिला',
    other: 'अन्य',
    state: 'राज्य (वैकल्पिक)',

    continue: 'जारी रखें',
    required: 'कृपया सभी ज़रूरी जानकारी भरें',
  },
  mr: {
    title: 'तुमची माहिती भरा',
    subtitle: 'चांगल्या आरोग्य सहाय्यासाठी ही माहिती आवश्यक आहे',
    name: 'पूर्ण नाव',
    namePlaceholder: 'तुमचे नाव',
    age: 'वय',
    agePlaceholder: 'जसे 30',
    gender: 'लिंग',
    male: 'पुरुष',
    female: 'स्त्री',
    other: 'इतर',
    state: 'राज्य (पर्यायी)',

    continue: 'पुढे चला',
    required: 'कृपया सर्व आवश्यक माहिती भरा',
  },
  en: {
    title: 'Complete Your Profile',
    subtitle: 'This information helps us provide better health assistance',
    name: 'Full Name',
    namePlaceholder: 'Your name',
    age: 'Age',
    agePlaceholder: 'e.g. 30',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    state: 'State (optional)',

    continue: 'Continue',
    required: 'Please fill all required fields',
  },
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry', 'Ladakh', 'J&K',
]

export default function ProfileOnboarding({ onComplete }) {
  const { language, changeLanguage } = useLanguage()
  const text = t[language] || t.en

  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [state, setState] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Auto-fill name from the user's email (if it contains a valid name)
  useEffect(() => {
    /**
     * Validate a name string against the KNOWN_FIRST_NAMES dictionary.
     * Returns the name (properly capitalised) if ALL word-parts are known,
     * or '' if any part is unrecognised.
     */
    function validateName(rawName) {
      if (!rawName || typeof rawName !== 'string') return ''
      const parts = rawName.trim().toLowerCase().split(/\s+/).filter(p => p.length > 0)
      if (parts.length === 0) return ''
      // Every part must be a known name
      const allKnown = parts.every(p => KNOWN_FIRST_NAMES.has(p))
      if (!allKnown) return ''
      const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
      return parts.map(capitalise).join(' ')
    }

    async function prefillName() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Detect sign-in provider — only trust metadata from OAuth providers like Google
          const provider = user.app_metadata?.provider
          const isOAuth = provider && provider !== 'email'

          const metaName = user.user_metadata?.full_name || user.user_metadata?.name

          if (isOAuth && metaName && metaName.trim()) {
            // Google/OAuth sign-in — the name comes from the identity provider, trust it
            setName(metaName.trim())
            return
          }

          if (!isOAuth && metaName && metaName.trim()) {
            // Email/password sign-up — Supabase often auto-fills metadata.name
            // from the email local-part (e.g. "mujhepechano"), so we MUST validate
            const validated = validateName(metaName)
            if (validated) {
              setName(validated)
              return
            }
          }

          // Fallback: try to extract name from email
          const email = user.email
          const extracted = extractNameFromEmail(email)
          if (extracted) {
            setName(extracted)
          }
        }
      } catch (err) {
        // Silently fail — user can still type their name manually
        console.warn('Could not prefill name from email:', err)
      }
    }
    prefillName()
  }, [])



  const handleSubmit = async () => {
    if (!name.trim() || !age || !gender) {
      setError(text.required)
      return
    }

    setSaving(true)
    setError('')

    try {
      // Save to localStorage first (works for both guest and authenticated)
      localStorage.setItem('mediguide_patient_name', name.trim())
      localStorage.setItem('mediguide_patient_age', age)
      localStorage.setItem('mediguide_patient_gender', gender)
      localStorage.setItem('mediguide_language', language)
      if (state) localStorage.setItem('mediguide_patient_state', state)

      // If authenticated (not guest), also save to backend profile
      const isGuest = localStorage.getItem('mediguide_guest') === 'true'
      if (!isGuest) {
        try {
          await updateProfile({
            full_name: name.trim(),
            age: parseInt(age),
            gender,
            state: state || null,
            preferred_lang: language,
          })
        } catch (apiErr) {
          // Don't block — data is already in localStorage
          console.warn('Profile API save failed (data saved locally):', apiErr)
        }
      }

      toast.success(
        language === 'hi' ? '\u092a\u094d\u0930\u094b\u092b\u093c\u093e\u0907\u0932 \u0938\u0947\u0935 \u0939\u094b \u0917\u0908! \ud83c\udf89' :
        language === 'mr' ? '\u092a\u094d\u0930\u094b\u092b\u093e\u0907\u0932 \u0938\u0947\u0935\u094d\u0939 \u091d\u093e\u0932\u0947! \ud83c\udf89' :
        'Profile saved! \ud83c\udf89'
      )

      onComplete()
    } catch (err) {
      console.error('Profile save error:', err)
      setError(
        language === 'hi' ? '\u0938\u0947\u0935 \u0915\u0930\u0928\u0947 \u092e\u0947\u0902 \u0924\u094d\u0930\u0941\u091f\u093f\u0964 \u0915\u0943\u092a\u092f\u093e \u092b\u093f\u0930 \u0938\u0947 \u0915\u094b\u0936\u093f\u0936 \u0915\u0930\u0947\u0902\u0964' :
        language === 'mr' ? '\u0938\u0947\u0935\u094d\u0939 \u0915\u0930\u0923\u094d\u092f\u093e\u0924 \u0924\u094d\u0930\u0941\u091f\u0940. \u0915\u0943\u092a\u092f\u093e \u092a\u0941\u0928\u094d\u0939\u093e \u092a\u094d\u0930\u092f\u0924\u094d\u0928 \u0915\u0930\u093e.' :
        'Failed to save. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center clinical-glass-overlay px-5">
      <div className="w-full max-w-sm rounded-clinical-xl overflow-hidden animate-slide-up bg-white shadow-clinical-xl">
        {/* Header */}
        <div className="px-6 py-6 text-center bg-primary-fixed/30">
          <div className="w-14 h-14 mx-auto mb-3 rounded-clinical-lg bg-primary/10 flex items-center justify-center">
            <FiUser className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-lg font-bold font-display text-on-surface">{text.title}</h2>
          <p className="text-xs text-on-surface-variant mt-1">{text.subtitle}</p>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-clinical-meta">
              {text.name} <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              placeholder={text.namePlaceholder}
              autoFocus
              className="clinical-input"
            />
          </div>

          {/* Age + Gender */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-clinical-meta">
                {text.age} <span className="text-error">*</span>
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => { setAge(e.target.value); setError('') }}
                placeholder={text.agePlaceholder}
                min="0"
                max="120"
                className="clinical-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-clinical-meta">
                {text.gender} <span className="text-error">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => { setGender(e.target.value); setError('') }}
                className="clinical-input"
              >
                <option value="">—</option>
                <option value="male">{text.male}</option>
                <option value="female">{text.female}</option>
                <option value="other">{text.other}</option>
              </select>
            </div>
          </div>

          {/* State (optional) */}
          <div className="space-y-1.5">
            <label className="text-clinical-meta">
              {text.state}
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="clinical-input"
            >
              <option value="">—</option>
              {INDIAN_STATES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>


          {/* Error */}
          {error && (
            <p className="text-xs text-error text-center animate-fade-in">{error}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full btn-primary flex items-center justify-center gap-2 text-sm py-3 disabled:opacity-50"
          >
            {saving ? (
              <FiLoader className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <FiArrowRight className="w-4 h-4" />
                {text.continue}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
