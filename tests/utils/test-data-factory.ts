import { faker } from '@faker-js/faker'

// Test data factory for consistent test data generation
export class TestDataFactory {
  static user(overrides?: Partial<User>) {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      name: faker.person.fullName(),
      avatar: faker.image.avatar(),
      createdAt: faker.date.past(),
      ...overrides
    }
  }

  static chat(overrides?: Partial<Chat>) {
    return {
      id: faker.string.uuid(),
      title: faker.lorem.sentence(),
      userId: faker.string.uuid(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      messages: [],
      ...overrides
    }
  }

  static message(overrides?: Partial<Message>) {
    return {
      id: faker.string.uuid(),
      content: faker.lorem.paragraph(),
      role: faker.helpers.arrayElement(['user', 'assistant']) as 'user' | 'assistant',
      chatId: faker.string.uuid(),
      createdAt: faker.date.recent(),
      ...overrides
    }
  }

  static conversation(messageCount = 5) {
    const chat = this.chat()
    const messages = Array.from({ length: messageCount }, (_, i) =>
      this.message({
        chatId: chat.id,
        role: i % 2 === 0 ? 'user' : 'assistant',
        createdAt: new Date(Date.now() - (messageCount - i) * 60000)
      })
    )

    return { ...chat, messages }
  }

  static automationData() {
    return {
      briefing: {
        date: faker.date.recent().toISOString(),
        highlights: Array.from({ length: 3 }, () => faker.lorem.sentence()),
        ai_updates: Array.from({ length: 2 }, () => ({
          title: faker.lorem.words(3),
          description: faker.lorem.sentence()
        })),
        dev_tip: {
          title: faker.lorem.words(4),
          description: faker.lorem.paragraph()
        }
      }
    }
  }
}

// Type definitions for test data
export interface User {
  id: string
  email: string
  name: string
  avatar: string
  createdAt: Date
}

export interface Chat {
  id: string
  title: string
  userId: string
  createdAt: Date
  updatedAt: Date
  messages: Message[]
}

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  chatId: string
  createdAt: Date
}

// Mock API responses
export class MockApiResponses {
  static chatStream(messages: string[]) {
    return messages.map((content, index) => ({
      id: faker.string.uuid(),
      object: 'chat.completion.chunk',
      created: Date.now(),
      model: 'gpt-4',
      choices: [{
        delta: { content },
        index,
        finish_reason: index === messages.length - 1 ? 'stop' : null
      }]
    }))
  }

  static error(status = 500, message = 'Internal Server Error') {
    return {
      error: {
        type: 'server_error',
        message,
        code: status
      }
    }
  }

  static success(data: any) {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString()
    }
  }
}