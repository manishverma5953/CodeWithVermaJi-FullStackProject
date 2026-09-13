/**
 * Dev database seeder for CodeWithVermaji.
 *
 * The app has no UI to create Categories (createCategory is an admin-only API),
 * so a fresh database leaves the Catalog permanently empty and nothing
 * downstream (enroll / cart / payment) can be exercised. This script seeds:
 *   - one Instructor and one Student account (known passwords)
 *   - several Categories
 *   - Published Courses in each category, each with a Section + SubSections
 *
 * Run:  npm run seed   (from the server/ folder)
 *
 * It is idempotent: it removes previously seeded content (courses, sections,
 * subsections, categories, and the two seed users) and recreates it. It does
 * NOT touch any other real user accounts.
 */
require("dotenv").config()
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")

const User = require("./models/User")
const Profile = require("./models/Profile")
const Category = require("./models/Category")
const Course = require("./models/Course")
const Section = require("./models/Section")
const SubSection = require("./models/Subsection")

const INSTRUCTOR_EMAIL = "instructor@codewithvermaji.com"
const STUDENT_EMAIL = "student@codewithvermaji.com"
const INSTRUCTOR_PASSWORD = "Instructor@123"
const STUDENT_PASSWORD = "Student@123"

// A reliable, embeddable sample video (Cloudinary CDN). The previously used
// Google storage sample started returning 403, which broke playback.
const SAMPLE_VIDEO = "https://res.cloudinary.com/demo/video/upload/dog.mp4"
const thumb = (seed) => `https://picsum.photos/seed/${seed}/400/250`

// Categories and their courses to create.
const CATALOG = [
  {
    name: "Web Development",
    description: "Build modern, full-stack web applications.",
    courses: [
      {
        courseName: "The Complete MERN Stack Bootcamp",
        courseDescription:
          "Master MongoDB, Express, React and Node by building real projects.",
        whatYouWillLearn:
          "REST APIs, authentication, React state management, and deployment.",
        price: 499,
        tag: ["MERN", "React", "Node"],
        instructions: ["Basic JavaScript knowledge", "A code editor"],
      },
      {
        courseName: "Modern CSS & Tailwind Masterclass",
        courseDescription:
          "Go from plain CSS to responsive, utility-first designs with Tailwind.",
        whatYouWillLearn: "Flexbox, Grid, responsive design, and Tailwind CSS.",
        price: 299,
        tag: ["CSS", "Tailwind", "Frontend"],
        instructions: ["A browser", "Basic HTML"],
      },
    ],
  },
  {
    name: "Data Science",
    description: "Turn data into insight with Python and machine learning.",
    courses: [
      {
        courseName: "Python for Data Science",
        courseDescription:
          "NumPy, Pandas, and visualization for real-world data analysis.",
        whatYouWillLearn: "Data wrangling, analysis, and visualization.",
        price: 599,
        tag: ["Python", "Pandas", "Data"],
        instructions: ["Basic Python"],
      },
      {
        courseName: "Machine Learning Fundamentals",
        courseDescription:
          "Understand core ML algorithms and build your first models.",
        whatYouWillLearn: "Regression, classification, and model evaluation.",
        price: 799,
        tag: ["ML", "AI", "Python"],
        instructions: ["Python", "Basic maths"],
      },
    ],
  },
  {
    name: "Programming Fundamentals",
    description: "Strengthen your core programming and problem-solving skills.",
    courses: [
      {
        courseName: "Data Structures & Algorithms in JavaScript",
        courseDescription:
          "Arrays, linked lists, trees, graphs and the patterns to crack interviews.",
        whatYouWillLearn: "Core data structures and algorithmic thinking.",
        price: 699,
        tag: ["DSA", "JavaScript", "Interview"],
        instructions: ["Basic JavaScript"],
      },
    ],
  },
  {
    name: "Mobile Development",
    description: "Ship cross-platform mobile apps.",
    courses: [
      {
        courseName: "React Native from Zero to Store",
        courseDescription:
          "Build and publish a real mobile app for Android and iOS.",
        whatYouWillLearn: "Navigation, native modules, and publishing.",
        price: 549,
        tag: ["React Native", "Mobile"],
        instructions: ["React basics"],
      },
    ],
  },
]

async function upsertUser({ firstName, lastName, email, password, accountType }) {
  // Remove any prior seed user + its profile so re-runs stay clean.
  const existing = await User.findOne({ email })
  if (existing) {
    if (existing.additionalDetails) {
      await Profile.findByIdAndDelete(existing.additionalDetails)
    }
    await User.findByIdAndDelete(existing._id)
  }
  const profile = await Profile.create({
    gender: null,
    dateOfBirth: null,
    about: `${firstName} ${lastName} — seeded account`,
    contactNumber: null,
  })
  const hashed = await bcrypt.hash(password, 10)
  const user = await User.create({
    firstName,
    lastName,
    email,
    password: hashed,
    accountType,
    approved: true,
    active: true,
    additionalDetails: profile._id,
    image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
  })
  return user
}

async function seed() {
  if (!process.env.MONGODB_URL) {
    throw new Error("MONGODB_URL is not set. Check server/.env")
  }
  await mongoose.connect(process.env.MONGODB_URL)
  console.log("Connected to DB. Seeding...")

  // Clean previously seeded content (safe on a fresh/test DB).
  await Course.deleteMany({})
  await Section.deleteMany({})
  await SubSection.deleteMany({})
  await Category.deleteMany({})
  console.log("Cleared existing courses, sections, subsections, categories.")

  const instructor = await upsertUser({
    firstName: "Verma",
    lastName: "Instructor",
    email: INSTRUCTOR_EMAIL,
    password: INSTRUCTOR_PASSWORD,
    accountType: "Instructor",
  })
  const student = await upsertUser({
    firstName: "Test",
    lastName: "Student",
    email: STUDENT_EMAIL,
    password: STUDENT_PASSWORD,
    accountType: "Student",
  })
  console.log("Created instructor and student accounts.")

  let courseCount = 0
  const instructorCourseIds = []

  for (const cat of CATALOG) {
    const category = await Category.create({
      name: cat.name,
      description: cat.description,
      courses: [],
    })

    for (const c of cat.courses) {
      // Build one section with two sample lectures.
      const sub1 = await SubSection.create({
        title: "Introduction",
        timeDuration: "596",
        description: "Welcome and course overview.",
        videoUrl: SAMPLE_VIDEO,
      })
      const sub2 = await SubSection.create({
        title: "Getting Started",
        timeDuration: "596",
        description: "Setting up your environment.",
        videoUrl: SAMPLE_VIDEO,
      })
      const section = await Section.create({
        sectionName: "Getting Started",
        subSection: [sub1._id, sub2._id],
      })

      const course = await Course.create({
        courseName: c.courseName,
        courseDescription: c.courseDescription,
        instructor: instructor._id,
        whatYouWillLearn: c.whatYouWillLearn,
        courseContent: [section._id],
        ratingAndReviews: [],
        price: c.price,
        thumbnail: thumb(encodeURIComponent(c.courseName)),
        tag: c.tag,
        category: category._id,
        studentsEnroled: [],
        instructions: c.instructions,
        status: "Published",
      })

      category.courses.push(course._id)
      instructorCourseIds.push(course._id)
      courseCount++
    }

    await category.save()
    console.log(`  Category "${cat.name}" -> ${cat.courses.length} course(s)`)
  }

  // Attach the created courses to the instructor.
  await User.findByIdAndUpdate(instructor._id, {
    $set: { courses: instructorCourseIds },
  })

  console.log("\nSeed complete.")
  console.log(`  Categories: ${CATALOG.length}`)
  console.log(`  Courses:    ${courseCount}`)
  console.log("\nLogin credentials:")
  console.log(`  Instructor: ${INSTRUCTOR_EMAIL} / ${INSTRUCTOR_PASSWORD}`)
  console.log(`  Student:    ${STUDENT_EMAIL} / ${STUDENT_PASSWORD}`)

  await mongoose.disconnect()
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err)
    process.exit(1)
  })
