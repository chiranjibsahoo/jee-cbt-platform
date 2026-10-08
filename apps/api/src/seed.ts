import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.performanceSnapshot.deleteMany();
  await prisma.attemptEvent.deleteMany();
  await prisma.attemptAnswer.deleteMany();
  await prisma.examAttempt.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.mistake.deleteMany();
  await prisma.examQuestion.deleteMany();
  await prisma.examSection.deleteMany();
  await prisma.examConfig.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const adminHash = await bcrypt.hash('admin123', 12);
  const studentHash = await bcrypt.hash('student123', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@jeecbt.com',
      name: 'Admin User',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

  const student = await prisma.user.create({
    data: {
      email: 'student@jeecbt.com',
      name: 'Demo Student',
      passwordHash: studentHash,
      role: 'STUDENT',
    },
  });

  console.log('✅ Users created');

  // ===== QUESTIONS =====

  const physicsQuestions = [
    {
      subject: 'PHYSICS' as const,
      chapter: 'Kinematics',
      topic: 'Projectile Motion',
      questionType: 'MCQ_SINGLE' as const,
      difficulty: 'MEDIUM' as const,
      questionText: 'A ball is thrown horizontally from the top of a tower of height 40 m with a velocity of 10 m/s. The time taken by the ball to reach the ground is (g = 10 m/s²):',
      solution: 'Using h = ½gt², 40 = ½ × 10 × t², t² = 8, t = 2√2 ≈ 2.83 s',
      explanation: 'For horizontal projectile, vertical motion: h = ½gt². Solve for t.',
      formulaUsed: 'h = ½gt²',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: '2 s', isCorrect: false },
        { label: 'B', text: '2√2 s', isCorrect: true },
        { label: 'C', text: '4 s', isCorrect: false },
        { label: 'D', text: '√2 s', isCorrect: false },
      ],
    },
    {
      subject: 'PHYSICS' as const,
      chapter: 'Kinematics',
      topic: 'Equations of Motion',
      questionType: 'MCQ_SINGLE' as const,
      difficulty: 'EASY' as const,
      questionText: 'A body starts from rest and moves with uniform acceleration of 5 m/s². The distance covered in the 5th second of motion is:',
      solution: 'Using s_n = u + a(2n-1)/2 = 0 + 5(2×5-1)/2 = 5×9/2 = 22.5 m',
      explanation: 'Distance in nth second: s_n = u + a(2n-1)/2',
      formulaUsed: 'sₙ = u + a(2n−1)/2',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: '20 m', isCorrect: false },
        { label: 'B', text: '22.5 m', isCorrect: true },
        { label: 'C', text: '25 m', isCorrect: false },
        { label: 'D', text: '12.5 m', isCorrect: false },
      ],
    },
    {
      subject: 'PHYSICS' as const,
      chapter: 'Laws of Motion',
      topic: "Newton's Laws",
      questionType: 'MCQ_SINGLE' as const,
      difficulty: 'MEDIUM' as const,
      questionText: 'A block of mass 5 kg rests on a rough surface with coefficient of friction μ = 0.4. The minimum force required to move the block is (g = 10 m/s²):',
      solution: 'f_s = μmg = 0.4 × 5 × 10 = 20 N',
      explanation: 'Minimum force to overcome static friction equals μₛmg.',
      formulaUsed: 'f = μmg',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: '10 N', isCorrect: false },
        { label: 'B', text: '15 N', isCorrect: false },
        { label: 'C', text: '20 N', isCorrect: true },
        { label: 'D', text: '25 N', isCorrect: false },
      ],
    },
    {
      subject: 'PHYSICS' as const,
      chapter: 'Work Energy Power',
      topic: 'Work-Energy Theorem',
      questionType: 'MCQ_SINGLE' as const,
      difficulty: 'MEDIUM' as const,
      questionText: 'A particle of mass 2 kg moves with velocity v = (3î + 4ĵ) m/s. Its kinetic energy is:',
      solution: 'v = √(3² + 4²) = 5 m/s, KE = ½mv² = ½ × 2 × 25 = 25 J',
      explanation: 'KE = ½m|v|² where |v| = √(vₓ² + vᵧ²)',
      formulaUsed: 'KE = ½mv²',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: '12.5 J', isCorrect: false },
        { label: 'B', text: '20 J', isCorrect: false },
        { label: 'C', text: '25 J', isCorrect: true },
        { label: 'D', text: '50 J', isCorrect: false },
      ],
    },
    {
      subject: 'PHYSICS' as const,
      chapter: 'Modern Physics',
      topic: 'Photoelectric Effect',
      questionType: 'MCQ_SINGLE' as const,
      difficulty: 'HARD' as const,
      questionText: 'The threshold wavelength for photoelectric emission from a metal surface is 600 nm. What is the work function of the metal? (h = 6.63 × 10⁻³⁴ J·s, c = 3 × 10⁸ m/s)',
      solution: 'φ = hc/λ₀ = (6.63×10⁻³⁴ × 3×10⁸)/(600×10⁻⁹) = 3.315×10⁻¹⁹ J ≈ 2.07 eV',
      explanation: 'Work function φ = hc/λ₀. Convert to eV by dividing by 1.6×10⁻¹⁹ J/eV.',
      formulaUsed: 'φ = hc/λ₀',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: '1.5 eV', isCorrect: false },
        { label: 'B', text: '2.07 eV', isCorrect: true },
        { label: 'C', text: '3.1 eV', isCorrect: false },
        { label: 'D', text: '4.14 eV', isCorrect: false },
      ],
    },
    {
      subject: 'PHYSICS' as const,
      chapter: 'Units and Measurements',
      topic: 'Dimensional Analysis',
      questionType: 'MCQ_SINGLE' as const,
      difficulty: 'EASY' as const,
      questionText: 'The dimensional formula for pressure is:',
      solution: 'Pressure = Force/Area = MLT⁻²/L² = ML⁻¹T⁻²',
      explanation: 'Pressure = F/A. Force has dimensions MLT⁻². Area has dimensions L². So P = ML⁻¹T⁻².',
      formulaUsed: 'P = F/A',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: '[MLT⁻²]', isCorrect: false },
        { label: 'B', text: '[ML⁻¹T⁻²]', isCorrect: true },
        { label: 'C', text: '[ML²T⁻²]', isCorrect: false },
        { label: 'D', text: '[ML⁻²T⁻¹]', isCorrect: false },
      ],
    },
    {
      subject: 'PHYSICS' as const,
      chapter: 'Kinematics',
      topic: 'Relative Motion',
      questionType: 'NUMERICAL' as const,
      difficulty: 'MEDIUM' as const,
      questionText: 'Two trains A and B are moving in the same direction with velocities 60 km/h and 40 km/h respectively. What is the relative velocity of B with respect to A (in km/h)?',
      solution: 'v_BA = v_B - v_A = 40 - 60 = -20 km/h. Magnitude = 20 km/h.',
      explanation: 'Relative velocity = velocity of B - velocity of A. Negative sign means B appears to move backward relative to A.',
      formulaUsed: 'v_rel = v_B - v_A',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'ANSWER', text: '-20', isCorrect: true },
      ],
    },
    {
      subject: 'PHYSICS' as const,
      chapter: 'Laws of Motion',
      topic: 'Circular Motion',
      questionType: 'MCQ_SINGLE' as const,
      difficulty: 'HARD' as const,
      questionText: 'A car moves on a circular path of radius 100 m with a speed of 20 m/s. The coefficient of friction between the tires and the road must be at least (g = 10 m/s²):',
      solution: 'For circular motion on flat road: μmg ≥ mv²/r, so μ ≥ v²/(rg) = 400/1000 = 0.4',
      explanation: 'Centripetal force is provided by friction. f = mv²/r, and f ≤ μmg, so μ ≥ v²/rg.',
      formulaUsed: 'μ ≥ v²/rg',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: '0.2', isCorrect: false },
        { label: 'B', text: '0.4', isCorrect: true },
        { label: 'C', text: '0.5', isCorrect: false },
        { label: 'D', text: '0.8', isCorrect: false },
      ],
    },
    {
      subject: 'PHYSICS' as const,
      chapter: 'Rotational Motion',
      topic: 'Moment of Inertia',
      questionType: 'MCQ_SINGLE' as const,
      difficulty: 'MEDIUM' as const,
      questionText: 'The moment of inertia of a uniform solid sphere of mass M and radius R about a diameter is:',
      solution: 'I = 2MR²/5',
      explanation: 'This is a standard result from integration. For a solid sphere about a diameter: I = 2MR²/5.',
      formulaUsed: 'I = 2MR²/5',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: 'MR²/2', isCorrect: false },
        { label: 'B', text: '2MR²/3', isCorrect: false },
        { label: 'C', text: '2MR²/5', isCorrect: true },
        { label: 'D', text: 'MR²/5', isCorrect: false },
      ],
    },
    {
      subject: 'PHYSICS' as const,
      chapter: 'Thermodynamics',
      topic: 'First Law',
      questionType: 'MCQ_SINGLE' as const,
      difficulty: 'MEDIUM' as const,
      questionText: 'An ideal gas undergoes isothermal expansion. Which of the following is true?',
      solution: 'For isothermal process of ideal gas: ΔU = 0, W = Q',
      explanation: 'In isothermal process, temperature is constant. For ideal gas, internal energy depends only on temperature, so ΔU = 0. By first law: Q = W.',
      formulaUsed: 'ΔU = Q - W = 0 (isothermal)',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: 'Internal energy increases', isCorrect: false },
        { label: 'B', text: 'Heat absorbed equals work done', isCorrect: true },
        { label: 'C', text: 'No heat is exchanged', isCorrect: false },
        { label: 'D', text: 'Pressure remains constant', isCorrect: false },
      ],
    },
  ];

  const chemistryQuestions = [
    {
      subject: 'CHEMISTRY' as const,
      chapter: 'Mole Concept',
      topic: 'Molar Mass',
      questionType: 'MCQ_SINGLE' as const,
      difficulty: 'EASY' as const,
      questionText: 'How many atoms are present in 18 g of water? (Nₐ = 6.022 × 10²³)',
      solution: 'Moles of H₂O = 18/18 = 1 mol. Each molecule has 3 atoms. Atoms = 3 × 6.022×10²³ = 1.8066×10²⁴',
      explanation: 'Water (H₂O) has molar mass 18 g/mol. 1 mole contains Nₐ molecules. Each H₂O has 3 atoms (2H + 1O).',
      formulaUsed: 'n = mass/molar mass',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: '6.022 × 10²³', isCorrect: false },
        { label: 'B', text: '1.2044 × 10²⁴', isCorrect: false },
        { label: 'C', text: '1.8066 × 10²⁴', isCorrect: true },
        { label: 'D', text: '3.011 × 10²³', isCorrect: false },
      ],
    },
    {
      subject: 'CHEMISTRY' as const,
      chapter: 'Atomic Structure',
      topic: "Bohr's Model",
      questionType: 'MCQ_SINGLE' as const,
      difficulty: 'MEDIUM' as const,
      questionText: "According to Bohr's model, the energy of an electron in the nth orbit of hydrogen atom is proportional to:",
      solution: 'Eₙ = -13.6/n² eV, so Eₙ ∝ 1/n² ∝ n⁻²',
      explanation: "In Bohr's model, Eₙ = -13.6/n² eV. Energy is proportional to 1/n² (inversely proportional to n²).",
      formulaUsed: 'Eₙ = -13.6/n² eV',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: 'n', isCorrect: false },
        { label: 'B', text: '1/n', isCorrect: false },
        { label: 'C', text: '1/n²', isCorrect: true },
        { label: 'D', text: 'n²', isCorrect: false },
      ],
    },
    {
      subject: 'CHEMISTRY' as const,
      chapter: 'Chemical Bonding',
      topic: 'Hybridization',
      questionType: 'MCQ_SINGLE' as const,
      difficulty: 'MEDIUM' as const,
      questionText: 'The hybridization of carbon in CO₂ is:',
      solution: 'CO₂: O=C=O. Carbon has 2 double bonds and no lone pairs. sp hybridization.',
      explanation: 'CO₂ has linear geometry (O=C=O). Carbon forms 2 σ bonds and 2 π bonds. With 2 σ bonds, hybridization is sp.',
      formulaUsed: 'Hybridization = steric number formula',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: 'sp³', isCorrect: false },
        { label: 'B', text: 'sp²', isCorrect: false },
        { label: 'C', text: 'sp', isCorrect: true },
        { label: 'D', text: 'sp³d', isCorrect: false },
      ],
    },
    {
      subject: 'CHEMISTRY' as const,
      chapter: 'Thermodynamics',
      topic: 'Gibbs Energy',
      questionType: 'MCQ_SINGLE' as const,
      difficulty: 'HARD' as const,
      questionText: 'For a reaction to be spontaneous at all temperatures, the conditions are:',
      solution: 'G = H - TS. For G < 0 at all T: need ΔH < 0 and ΔS > 0',
      explanation: 'ΔG = ΔH - TΔS. For spontaneity at all temperatures, ΔG must be negative for all T > 0. This requires ΔH < 0 and ΔS > 0.',
      formulaUsed: 'ΔG = ΔH - TΔS',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: 'ΔH > 0, ΔS > 0', isCorrect: false },
        { label: 'B', text: 'ΔH < 0, ΔS < 0', isCorrect: false },
        { label: 'C', text: 'ΔH < 0, ΔS > 0', isCorrect: true },
        { label: 'D', text: 'ΔH > 0, ΔS < 0', isCorrect: false },
      ],
    },
    {
      subject: 'CHEMISTRY' as const,
      chapter: 'Organic Basics',
      topic: 'IUPAC Nomenclature',
      questionType: 'MCQ_SINGLE' as const,
      difficulty: 'EASY' as const,
      questionText: 'The IUPAC name of CH₃-CH₂-CH(OH)-CH₃ is:',
      solution: 'Longest chain: 4 carbons (butane). OH on C-2. Name: Butan-2-ol',
      explanation: 'Find longest chain containing the functional group. Number to give lowest locant to OH. 4-carbon chain with OH at position 2.',
      formulaUsed: 'IUPAC rules for alcohols',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: '2-methylpropan-1-ol', isCorrect: false },
        { label: 'B', text: 'Butan-2-ol', isCorrect: true },
        { label: 'C', text: 'Butan-3-ol', isCorrect: false },
        { label: 'D', text: '2-butanol', isCorrect: false },
      ],
    },
    {
      subject: 'CHEMISTRY' as const,
      chapter: 'Mole Concept',
      topic: 'Stoichiometry',
      questionType: 'NUMERICAL' as const,
      difficulty: 'MEDIUM' as const,
      questionText: 'How many grams of oxygen are required to completely combust 4 g of hydrogen? (Atomic mass: H = 1, O = 16)',
      solution: '2H₂ + O₂ → 2H₂O. 4 mol H₂ requires 2 mol O₂. 4g H₂ = 2 mol. O₂ required = 1 mol = 32 g.',
      explanation: 'Moles of H₂ = 4/2 = 2 mol. From stoichiometry, 2H₂ needs 1 O₂. So 2 mol H₂ needs 1 mol O₂ = 32 g.',
      formulaUsed: '2H₂ + O₂ → 2H₂O',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'ANSWER', text: '32', isCorrect: true },
      ],
    },
    {
      subject: 'CHEMISTRY' as const,
      chapter: 'Atomic Structure',
      topic: 'Quantum Numbers',
      questionType: 'MCQ_SINGLE' as const,
      difficulty: 'MEDIUM' as const,
      questionText: 'The maximum number of electrons in the subshell with azimuthal quantum number l = 3 is:',
      solution: 'l = 3 means f-subshell. Number of orbitals = 2l+1 = 7. Max electrons = 2×7 = 14.',
      explanation: 'For l=3 (f subshell), ml ranges from -3 to +3 giving 7 orbitals. Each orbital holds 2 electrons max.',
      formulaUsed: 'Max electrons = 2(2l+1)',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: '6', isCorrect: false },
        { label: 'B', text: '10', isCorrect: false },
        { label: 'C', text: '14', isCorrect: true },
        { label: 'D', text: '18', isCorrect: false },
      ],
    },
    {
      subject: 'CHEMISTRY' as const,
      chapter: 'Chemical Bonding',
      topic: 'Molecular Geometry',
      questionType: 'MCQ_SINGLE' as const,
      difficulty: 'HARD' as const,
      questionText: 'The shape of XeF₄ molecule is:',
      solution: 'XeF₄: Xe has 6 bond pairs + lone pairs. VSEPR: 4 bond pairs + 2 lone pairs → square planar.',
      explanation: 'Xe has 8 valence electrons. 4 used for bonds with F, 4 remain as 2 lone pairs. Total electron pairs = 6 (octahedral). 2 lone pairs in axial positions → square planar geometry.',
      formulaUsed: 'VSEPR theory',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: 'Tetrahedral', isCorrect: false },
        { label: 'B', text: 'See-saw', isCorrect: false },
        { label: 'C', text: 'Square planar', isCorrect: true },
        { label: 'D', text: 'Square pyramidal', isCorrect: false },
      ],
    },
    {
      subject: 'CHEMISTRY' as const,
      chapter: 'Organic Basics',
      topic: 'Isomerism',
      questionType: 'MCQ_MULTIPLE' as const,
      difficulty: 'HARD' as const,
      questionText: 'Which of the following pairs exhibit geometrical isomerism? (Select ALL correct options)',
      solution: 'Geometrical isomerism requires restricted rotation and different groups on each carbon of double bond.',
      explanation: 'Geometrical isomerism (cis-trans) occurs in alkenes where each double bond carbon has different substituents. Symmetrical alkenes cannot show this.',
      formulaUsed: 'Condition: restricted rotation + 2 different groups on each sp² carbon',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: '2-butene (CH₃CH=CHCH₃)', isCorrect: true },
        { label: 'B', text: '2-methylpropene ((CH₃)₂C=CH₂)', isCorrect: false },
        { label: 'C', text: '1,2-dichloroethene (ClCH=CHCl)', isCorrect: true },
        { label: 'D', text: 'Ethene (CH₂=CH₂)', isCorrect: false },
      ],
    },
    {
      subject: 'CHEMISTRY' as const,
      chapter: 'Thermodynamics',
      topic: 'Entropy',
      questionType: 'MCQ_SINGLE' as const,
      difficulty: 'MEDIUM' as const,
      questionText: 'Which process results in an increase in entropy?',
      solution: 'Entropy increases when disorder increases: solid → liquid → gas transition increases entropy.',
      explanation: 'Entropy (disorder) increases from solid to liquid to gas. Melting, vaporization, and dissolution typically increase entropy.',
      formulaUsed: 'ΔS > 0 for increase in disorder',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: 'Freezing of water', isCorrect: false },
        { label: 'B', text: 'Condensation of steam', isCorrect: false },
        { label: 'C', text: 'Vaporization of liquid', isCorrect: true },
        { label: 'D', text: 'Crystallization of solute', isCorrect: false },
      ],
    },
  ];

  const mathQuestions = [
    {
      subject: 'MATHEMATICS' as const,
      chapter: 'Quadratic Equations',
      topic: 'Roots of Equation',
      questionType: 'MCQ_SINGLE' as const,
      difficulty: 'EASY' as const,
      questionText: 'If α and β are the roots of x² - 5x + 6 = 0, then α² + β² is:',
      solution: 'α + β = 5, αβ = 6. α² + β² = (α+β)² - 2αβ = 25 - 12 = 13',
      explanation: 'Use Vieta\'s formulas: sum of roots = -b/a, product = c/a. Then use the identity α² + β² = (α+β)² - 2αβ.',
      formulaUsed: 'α² + β² = (α+β)² - 2αβ',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: '11', isCorrect: false },
        { label: 'B', text: '13', isCorrect: true },
        { label: 'C', text: '17', isCorrect: false },
        { label: 'D', text: '25', isCorrect: false },
      ],
    },
    {
      subject: 'MATHEMATICS' as const,
      chapter: 'Sequence and Series',
      topic: 'Arithmetic Progression',
      questionType: 'MCQ_SINGLE' as const,
      difficulty: 'EASY' as const,
      questionText: 'The sum of first 20 natural numbers is:',
      solution: 'S = n(n+1)/2 = 20×21/2 = 210',
      explanation: 'Sum of first n natural numbers = n(n+1)/2. For n=20: 20×21/2 = 210.',
      formulaUsed: 'Sₙ = n(n+1)/2',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: '190', isCorrect: false },
        { label: 'B', text: '200', isCorrect: false },
        { label: 'C', text: '210', isCorrect: true },
        { label: 'D', text: '220', isCorrect: false },
      ],
    },
    {
      subject: 'MATHEMATICS' as const,
      chapter: 'Trigonometry',
      topic: 'Trigonometric Identities',
      questionType: 'MCQ_SINGLE' as const,
      difficulty: 'MEDIUM' as const,
      questionText: 'The value of sin²15° + sin²75° is:',
      solution: 'sin²15° + sin²(90°-15°) = sin²15° + cos²15° = 1',
      explanation: 'sin(75°) = sin(90°-15°) = cos(15°). So the expression becomes sin²15° + cos²15° = 1 (by Pythagorean identity).',
      formulaUsed: 'sin²θ + cos²θ = 1',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: '0', isCorrect: false },
        { label: 'B', text: '1/2', isCorrect: false },
        { label: 'C', text: '1', isCorrect: true },
        { label: 'D', text: '√3/2', isCorrect: false },
      ],
    },
    {
      subject: 'MATHEMATICS' as const,
      chapter: 'Coordinate Geometry',
      topic: 'Distance Formula',
      questionType: 'MCQ_SINGLE' as const,
      difficulty: 'EASY' as const,
      questionText: 'The distance between points A(3, 4) and B(0, 0) is:',
      solution: 'd = √((3-0)² + (4-0)²) = √(9+16) = √25 = 5',
      explanation: 'Distance formula: d = √((x₂-x₁)² + (y₂-y₁)²)',
      formulaUsed: 'd = √((x₂-x₁)² + (y₂-y₁)²)',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: '3', isCorrect: false },
        { label: 'B', text: '4', isCorrect: false },
        { label: 'C', text: '5', isCorrect: true },
        { label: 'D', text: '7', isCorrect: false },
      ],
    },
    {
      subject: 'MATHEMATICS' as const,
      chapter: 'Calculus',
      topic: 'Differentiation',
      questionType: 'MCQ_SINGLE' as const,
      difficulty: 'MEDIUM' as const,
      questionText: 'If f(x) = x³ - 3x² + 2x, then f\'(x) at x = 2 is:',
      solution: "f'(x) = 3x² - 6x + 2. At x=2: f'(2) = 12 - 12 + 2 = 2",
      explanation: 'Differentiate: f\'(x) = 3x² - 6x + 2. Substitute x = 2.',
      formulaUsed: 'd/dx(xⁿ) = nxⁿ⁻¹',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: '0', isCorrect: false },
        { label: 'B', text: '2', isCorrect: true },
        { label: 'C', text: '4', isCorrect: false },
        { label: 'D', text: '6', isCorrect: false },
      ],
    },
    {
      subject: 'MATHEMATICS' as const,
      chapter: 'Calculus',
      topic: 'Integration',
      questionType: 'MCQ_SINGLE' as const,
      difficulty: 'MEDIUM' as const,
      questionText: 'The value of ∫₀¹ x² dx is:',
      solution: '∫₀¹ x² dx = [x³/3]₀¹ = 1/3 - 0 = 1/3',
      explanation: 'Use power rule for integration: ∫xⁿ dx = xⁿ⁺¹/(n+1). Apply limits.',
      formulaUsed: '∫xⁿ dx = xⁿ⁺¹/(n+1) + C',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: '1/4', isCorrect: false },
        { label: 'B', text: '1/3', isCorrect: true },
        { label: 'C', text: '1/2', isCorrect: false },
        { label: 'D', text: '1', isCorrect: false },
      ],
    },
    {
      subject: 'MATHEMATICS' as const,
      chapter: 'Quadratic Equations',
      topic: 'Discriminant',
      questionType: 'MCQ_SINGLE' as const,
      difficulty: 'MEDIUM' as const,
      questionText: 'The quadratic equation x² - kx + 9 = 0 has real and equal roots. The value of k is:',
      solution: 'For equal roots: D = 0. k² - 4×1×9 = 0. k² = 36. k = ±6.',
      explanation: 'Discriminant D = b² - 4ac = 0 for equal roots. Here a=1, b=-k, c=9. So k² = 36, k = ±6.',
      formulaUsed: 'D = b² - 4ac = 0',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: '±3', isCorrect: false },
        { label: 'B', text: '±6', isCorrect: true },
        { label: 'C', text: '±9', isCorrect: false },
        { label: 'D', text: '±12', isCorrect: false },
      ],
    },
    {
      subject: 'MATHEMATICS' as const,
      chapter: 'Coordinate Geometry',
      topic: 'Circle',
      questionType: 'MCQ_SINGLE' as const,
      difficulty: 'HARD' as const,
      questionText: 'The equation of circle with center (2, -3) and radius 4 is:',
      solution: '(x-2)² + (y+3)² = 16. Expanding: x² + y² - 4x + 6y - 3 = 0',
      explanation: 'Standard form: (x-h)² + (y-k)² = r². With (h,k)=(2,-3), r=4.',
      formulaUsed: '(x-h)² + (y-k)² = r²',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: 'x² + y² - 4x + 6y + 3 = 0', isCorrect: false },
        { label: 'B', text: 'x² + y² - 4x + 6y - 3 = 0', isCorrect: true },
        { label: 'C', text: 'x² + y² + 4x - 6y - 3 = 0', isCorrect: false },
        { label: 'D', text: 'x² + y² - 4x - 6y - 3 = 0', isCorrect: false },
      ],
    },
    {
      subject: 'MATHEMATICS' as const,
      chapter: 'Sequence and Series',
      topic: 'Geometric Progression',
      questionType: 'NUMERICAL' as const,
      difficulty: 'MEDIUM' as const,
      questionText: 'The sum of infinite geometric series 1 + 1/2 + 1/4 + 1/8 + ... is:',
      solution: 'S∞ = a/(1-r) = 1/(1-1/2) = 1/(1/2) = 2',
      explanation: 'For infinite GP with |r| < 1: S∞ = a/(1-r). Here a=1, r=1/2.',
      formulaUsed: 'S∞ = a/(1-r)',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'ANSWER', text: '2', isCorrect: true },
      ],
    },
    {
      subject: 'MATHEMATICS' as const,
      chapter: 'Trigonometry',
      topic: 'Inverse Trigonometry',
      questionType: 'MCQ_SINGLE' as const,
      difficulty: 'HARD' as const,
      questionText: 'The value of sin⁻¹(1/2) + cos⁻¹(1/2) is:',
      solution: 'sin⁻¹(x) + cos⁻¹(x) = π/2 for all x ∈ [-1,1]. So the answer is π/2.',
      explanation: 'This is a standard identity: sin⁻¹(x) + cos⁻¹(x) = π/2. Applies for all x in domain.',
      formulaUsed: 'sin⁻¹(x) + cos⁻¹(x) = π/2',
      correctMarks: 4,
      negativeMarks: -1,
      options: [
        { label: 'A', text: 'π/6', isCorrect: false },
        { label: 'B', text: 'π/3', isCorrect: false },
        { label: 'C', text: 'π/2', isCorrect: true },
        { label: 'D', text: 'π', isCorrect: false },
      ],
    },
  ];

  // Create all questions
  const allQuestionsData = [...physicsQuestions, ...chemistryQuestions, ...mathQuestions];
  const createdQuestions: Record<string, string[]> = {
    PHYSICS: [],
    CHEMISTRY: [],
    MATHEMATICS: [],
  };

  for (const qData of allQuestionsData) {
    const { options, ...questionData } = qData;
    const q = await prisma.question.create({
      data: {
        ...questionData,
        examType: 'JEE_MAIN',
        source: 'PRACTICE',
        isPYQ: false,
        options: {
          create: options.map((o, i) => ({
            optionLabel: o.label,
            optionText: o.text,
            isCorrect: o.isCorrect,
            order: i,
          })),
        },
      },
    });
    createdQuestions[q.subject].push(q.id);
  }

  console.log('✅ Questions created');

  // ===== CREATE JEE MAIN MOCK TEST =====

  const exam = await prisma.exam.create({
    data: {
      title: 'JEE Main Mock Test 01',
      description: 'Full-length JEE Main style mock test with Physics, Chemistry, and Mathematics. Each subject has 10 questions.',
      examType: 'JEE_MAIN',
      mode: 'FULL_TEST',
      duration: 60, // 60 minutes for demo (actual is 180)
      isPublished: true,
      isDemo: true,
      year: 2024,
      totalMarks: 120, // 30 questions × 4 marks
      config: {
        create: {
          correctMarks: 4,
          incorrectMarks: -1,
          unansweredMarks: 0,
          examSecurityMode: 'practice',
        },
      },
      sections: {
        create: [
          { name: 'Physics', subject: 'PHYSICS', questionCount: 10, order: 0 },
          { name: 'Chemistry', subject: 'CHEMISTRY', questionCount: 10, order: 1 },
          { name: 'Mathematics', subject: 'MATHEMATICS', questionCount: 10, order: 2 },
        ],
      },
    },
    include: { sections: true },
  });

  // Add questions to each section
  const sections = exam.sections;
  const physicsSection = sections.find(s => s.subject === 'PHYSICS')!;
  const chemSection = sections.find(s => s.subject === 'CHEMISTRY')!;
  const mathSection = sections.find(s => s.subject === 'MATHEMATICS')!;

  // Physics questions
  for (let i = 0; i < createdQuestions.PHYSICS.length; i++) {
    await prisma.examQuestion.create({
      data: {
        examId: exam.id,
        sectionId: physicsSection.id,
        questionId: createdQuestions.PHYSICS[i],
        order: i,
      },
    });
  }

  // Chemistry questions
  for (let i = 0; i < createdQuestions.CHEMISTRY.length; i++) {
    await prisma.examQuestion.create({
      data: {
        examId: exam.id,
        sectionId: chemSection.id,
        questionId: createdQuestions.CHEMISTRY[i],
        order: i,
      },
    });
  }

  // Math questions
  for (let i = 0; i < createdQuestions.MATHEMATICS.length; i++) {
    await prisma.examQuestion.create({
      data: {
        examId: exam.id,
        sectionId: mathSection.id,
        questionId: createdQuestions.MATHEMATICS[i],
        order: i,
      },
    });
  }

  console.log('✅ Mock exam created with 30 questions');

  // Create a shorter quick test
  const quickExam = await prisma.exam.create({
    data: {
      title: 'Physics Quick Test — Kinematics',
      description: 'Chapter-wise test on Kinematics for quick practice.',
      examType: 'JEE_MAIN',
      mode: 'CHAPTER_TEST',
      duration: 20,
      isPublished: true,
      isDemo: true,
      totalMarks: 12,
      config: {
        create: {
          correctMarks: 4,
          incorrectMarks: -1,
          unansweredMarks: 0,
        },
      },
      sections: {
        create: [
          { name: 'Kinematics', subject: 'PHYSICS', questionCount: 3, order: 0 },
        ],
      },
    },
    include: { sections: true },
  });

  // Add kinematics questions to quick exam
  const kinematicsQIds = createdQuestions.PHYSICS.slice(0, 3);
  for (let i = 0; i < kinematicsQIds.length; i++) {
    await prisma.examQuestion.create({
      data: {
        examId: quickExam.id,
        sectionId: quickExam.sections[0].id,
        questionId: kinematicsQIds[i],
        order: i,
      },
    });
  }

  console.log('✅ Quick test created');
  console.log('');
  console.log('🎉 Seeding complete!');
  console.log('');
  console.log('Test credentials:');
  console.log('  Admin: admin@jeecbt.com / admin123');
  console.log('  Student: student@jeecbt.com / student123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
