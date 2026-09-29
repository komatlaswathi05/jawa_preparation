import { Coffee, Database, FlaskConical, Layers, Leaf, Network, Rocket, Shield } from 'lucide-react'
import javaTopics from './javaData.js'
import sqlTopics from './sqlData.js'
import springTopics from './springData.js'
import springBootTopics from './springBootData.js'
import jpaTopics from './jpaData.js'
import securityTopics from './securityData.js'
import testingTopics from './testingData.js'
import microservicesTopics from './microservicesData.js'

// Every study category has its own page (e.g. /java) that lists its topics.
export const CATEGORIES = [
  {
    id: 'java',
    name: 'Java',
    path: '/java',
    icon: Coffee,
    description: 'Core Java from the basics to concurrency, the JVM and design patterns.',
    topics: javaTopics,
  },
  {
    id: 'sql',
    name: 'SQL & Database',
    shortName: 'SQL',
    path: '/sql',
    icon: Database,
    description: 'Write queries, design tables and understand transactions and indexes.',
    topics: sqlTopics,
  },
  {
    id: 'spring',
    name: 'Spring Framework',
    shortName: 'Spring',
    path: '/spring',
    icon: Leaf,
    description: 'IoC, dependency injection, beans and AOP — the foundation of Spring Boot.',
    topics: springTopics,
  },
  {
    id: 'spring-boot',
    name: 'Spring Boot',
    path: '/spring-boot',
    icon: Rocket,
    description: 'Build production-ready REST APIs with validation, caching and monitoring.',
    topics: springBootTopics,
  },
  {
    id: 'jpa',
    name: 'Spring Data JPA & Hibernate',
    shortName: 'JPA',
    path: '/jpa',
    icon: Layers,
    description: 'Map Java objects to tables, write repositories and manage transactions.',
    topics: jpaTopics,
  },
  {
    id: 'security',
    name: 'Spring Security',
    shortName: 'Security',
    path: '/security',
    icon: Shield,
    description: 'Authentication, authorization, password hashing and JWT.',
    topics: securityTopics,
  },
  {
    id: 'testing',
    name: 'Testing',
    path: '/testing',
    icon: FlaskConical,
    description: 'Unit and integration tests with JUnit 5, Mockito and Spring Boot test slices.',
    topics: testingTopics,
  },
  {
    id: 'microservices',
    name: 'Microservices',
    path: '/microservices',
    icon: Network,
    description: 'Distributed systems, messaging with Kafka, resilience and Docker.',
    topics: microservicesTopics,
  },
]

// All topics in curriculum order. Previous/Next navigation follows this order.
export const ALL_TOPICS = CATEGORIES.flatMap((category) => category.topics)

export const ALL_TOPIC_IDS = ALL_TOPICS.map((topic) => topic.id)

export function getCategory(categoryId) {
  return CATEGORIES.find((category) => category.id === categoryId)
}

export function getTopic(topicId) {
  return ALL_TOPICS.find((topic) => topic.id === topicId)
}

export function getTopicIds(categoryIds) {
  return ALL_TOPICS.filter((topic) => categoryIds.includes(topic.category)).map((topic) => topic.id)
}

export function getAdjacentTopics(topicId) {
  const index = ALL_TOPICS.findIndex((topic) => topic.id === topicId)
  return {
    previous: index > 0 ? ALL_TOPICS[index - 1] : null,
    next: index >= 0 && index < ALL_TOPICS.length - 1 ? ALL_TOPICS[index + 1] : null,
  }
}
