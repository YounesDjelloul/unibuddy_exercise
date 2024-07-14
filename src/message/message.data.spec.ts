import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { ObjectID } from 'mongodb';
import { MessageData } from './message.data';
import { ChatMessageModel, ChatMessageSchema } from './models/message.model';

import { ConfigManagerModule } from '../configuration/configuration-manager.module';
import { getTestConfiguration } from '../configuration/configuration-manager.utils';

const id = new ObjectID('5fe0cce861c8ea54018385af');
const conversationId = new ObjectID();
const senderId = new ObjectID('5fe0cce861c8ea54018385af');
const sender2Id = new ObjectID('5fe0cce861c8ea54018385aa');
const sender3Id = new ObjectID('5fe0cce861c8ea54018385ab');

class TestMessageData extends MessageData {
  async deleteMany() {
    await this.chatMessageModel.deleteMany();
  }
}

describe('MessageData', () => {
  let messageData: TestMessageData;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRootAsync({
          imports: [ConfigManagerModule],
          useFactory: () => {
            const databaseConfig =
              getTestConfiguration().database;
            return {
              uri: databaseConfig.connectionString,
            };
          },
        }),
        MongooseModule.forFeature([
          { name: ChatMessageModel.name, schema: ChatMessageSchema },
        ]),
      ],
      providers: [TestMessageData],
    }).compile();

    messageData = module.get<TestMessageData>(TestMessageData);
  });

  beforeEach(
    async () => {
    messageData.deleteMany();
  });

  afterEach(async () => {
    messageData.deleteMany();
  });

  it('should be defined', () => {
    expect(messageData).toBeDefined();
  });

  describe('create', () => {
    it('should be defined', () => {
      expect(messageData.create).toBeDefined();
    });

    it('successfully creates a message with no tags', async () => {
      const conversationId = new ObjectID();
      const message = await messageData.create(
        { conversationId, text: 'Hello world' },
        senderId,
      );

      const expectedResponse = {
        likes: [],
        resolved: false,
        deleted: false,
        reactions: [],
        text: 'Hello world',
        senderId: senderId,
        conversationId: conversationId,
        conversation: { id: conversationId.toHexString() },
        likesCount: 0,
        sender: { id: senderId.toHexString() },
        tags: [],
      };

      expect(message).toMatchObject(expectedResponse);
    });

    it('successfully creates a message with one tag', async () => {
      const conversationId = new ObjectID();
      const messageTags = ['firstTAG'];

      const message = await messageData.create(
        { conversationId, text: 'Hello world' },
        senderId,
        messageTags,
      );

      const expectedResponse = {
        likes: [],
        resolved: false,
        deleted: false,
        reactions: [],
        text: 'Hello world',
        senderId: senderId,
        conversationId: conversationId,
        conversation: { id: conversationId.toHexString() },
        likesCount: 0,
        sender: { id: senderId.toHexString() },
        tags: ['firstTAG'],
      };

      expect(message).toMatchObject(expectedResponse);
    });

    it('successfully creates a message with multiple tags', async () => {
      const conversationId = new ObjectID();
      const messageTags = ['firstTAG', 'secondTAG', 'thirdTAG'];

      const message = await messageData.create(
        { conversationId, text: 'Hello world' },
        senderId,
        messageTags,
      );

      const expectedResponse = {
        likes: [],
        resolved: false,
        deleted: false,
        reactions: [],
        text: 'Hello world',
        senderId: senderId,
        conversationId: conversationId,
        conversation: { id: conversationId.toHexString() },
        likesCount: 0,
        sender: { id: senderId.toHexString() },
        tags: ['firstTAG', 'secondTAG', 'thirdTAG'],
      };

      expect(message).toMatchObject(expectedResponse);
    });
  });

  describe('get', () => {
    it('should be defined', () => {
      expect(messageData.getMessage).toBeDefined();
    });

    it('successfully gets a message', async () => {
      const conversationId = new ObjectID();
      const sentMessage = await messageData.create(
        { conversationId, text: 'Hello world' },
        senderId,
      );

      const gotMessage = await messageData.getMessage(
        sentMessage.id.toHexString(),
      );

      expect(gotMessage).toMatchObject(sentMessage);
    });
  });

  describe('delete', () => {
    it('successfully marks a message as deleted', async () => {
      const conversationId = new ObjectID();
      const message = await messageData.create(
        { conversationId, text: 'Message to delete' },
        senderId,
      );

      // Make sure that it started off as not deleted
      expect(message.deleted).toEqual(false);

      await messageData.delete(message.id); // I don't there a point of checking the returned message's attribute deleted is true because it could push you wrong-footed and get a false positive

      // And that is it now deleted
      const retrievedMessage = await messageData.getMessage(
        message.id.toHexString(),
      );
      expect(retrievedMessage.deleted).toEqual(true);
    });
  });

  describe('update', () => {
    it('can update a chatMessage tags with an empty tags list', async () => {
      const conversationId = new ObjectID();
      const sentMessage = await messageData.create(
        { conversationId, text: 'Hello world' },
        senderId,
        ['TAG1', 'TAG2'],
      );

      // // Make sure that it started off with two tags
      expect(sentMessage.tags).toEqual(['TAG1', 'TAG2']);

      const newTagsList: string[] = [];

      const updatedMessage = await messageData.updateMessage(
        sentMessage.id,
        newTagsList,
      );

      const gotMessageAfterUpdate = await messageData.getMessage(
        sentMessage.id.toHexString(),
      );

      expect(updatedMessage.tags).toEqual(newTagsList);
      expect(gotMessageAfterUpdate.tags).toEqual(newTagsList);
    });
    it('can update a chatMessage tags with a non-empty tags list', async () => {
      const conversationId = new ObjectID();
      const sentMessage = await messageData.create(
        { conversationId, text: 'Hello world' },
        senderId,
        ['TAG1', 'TAG2'],
      );

      // // Make sure that it started off with two tags
      expect(sentMessage.tags).toEqual(['TAG1', 'TAG2']);

      const newTagsList: string[] = ['TAG3'];

      const updatedMessage = await messageData.updateMessage(
        sentMessage.id,
        newTagsList,
      );

      const gotMessageAfterUpdate = await messageData.getMessage(
        sentMessage.id.toHexString(),
      );

      expect(updatedMessage.tags).toEqual(newTagsList);
      expect(gotMessageAfterUpdate.tags).toEqual(newTagsList);
    });
  });
});
