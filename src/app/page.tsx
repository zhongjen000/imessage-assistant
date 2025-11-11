'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { MessageCircle, User, Settings } from 'lucide-react';

export default function Home() {
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  const { data: contacts, isLoading: contactsLoading } = trpc.contacts.getAll.useQuery();
  const { data: messages, isLoading: messagesLoading } = trpc.messages.getConversation.useQuery(
    { contactId: selectedContact!, limit: 50 },
    { enabled: !!selectedContact }
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Contact List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">iMessage Assistant</h1>
          <p className="text-sm text-gray-500">AI-powered response suggestions</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {contactsLoading ? (
            <div className="p-4 text-center text-gray-500">Loading contacts...</div>
          ) : contacts && contacts.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact.phoneNumber)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedContact === contact.phoneNumber ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {contact.displayName || contact.phoneNumber}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{contact.phoneNumber}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No contacts found. Make sure you have iMessage history.
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {contacts?.find((c) => c.phoneNumber === selectedContact)?.displayName ||
                      selectedContact}
                  </h2>
                  <p className="text-sm text-gray-500">{selectedContact}</p>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="text-center text-gray-500">Loading messages...</div>
              ) : messages && messages.length > 0 ? (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        message.isFromMe
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p>{message.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500">No messages found</div>
              )}
            </div>

            {/* Suggestion Area */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 mb-2">AI Suggestions</p>
                <p className="text-sm text-blue-700">
                  Select a conversation to get AI-powered response suggestions
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Select a Conversation
              </h2>
              <p className="text-gray-500">
                Choose a contact from the sidebar to view messages and get AI suggestions
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
