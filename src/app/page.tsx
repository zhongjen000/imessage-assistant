'use client';

import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, User, Settings, Search, UserCircle, Info } from 'lucide-react';
import { formatIMessageTimestamp, formatMessageDate, getDisplayName } from '@/lib/utils';
import { AISuggestions } from '@/components/AISuggestions';
import { ContactContextDialog } from '@/components/ContactContextDialog';
import { UserContextPanel } from '@/components/UserContextPanel';

export default function Home() {
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showContactContext, setShowContactContext] = useState(false);
  const [showUserContext, setShowUserContext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: contacts, isLoading: contactsLoading } = trpc.contacts.getAll.useQuery();
  const { data: messages, isLoading: messagesLoading } = trpc.messages.getConversation.useQuery(
    { contactId: selectedContact!, limit: 50 },
    { enabled: !!selectedContact }
  );

  const selectedContactData = contacts?.find((c) => c.phoneNumber === selectedContact);

  // Scroll to bottom when messages load or change
  useEffect(() => {
    if (messages && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Filter contacts based on search
  const filteredContacts = contacts?.filter((contact) => {
    const displayName = contact.displayName || contact.phoneNumber;
    const phoneNumber = contact.phoneNumber;
    const query = searchQuery.toLowerCase();
    return displayName.toLowerCase().includes(query) || phoneNumber.toLowerCase().includes(query);
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Contact List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">iMessage Assistant</h1>
            <p className="text-sm text-gray-500">AI-powered response suggestions</p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* User Context Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUserContext(true)}
            className="w-full"
          >
            <UserCircle className="w-4 h-4 mr-2" />
            Your Context & Status
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {contactsLoading ? (
            <div className="p-4 text-center text-gray-500">Loading contacts...</div>
          ) : filteredContacts && filteredContacts.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact.phoneNumber)}
                  className={`w-full p-3 text-left hover:bg-gray-50 transition-colors relative ${
                    selectedContact === contact.phoneNumber ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Blue dot for unread messages */}
                    {contact.hasUnread ? (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                    ) : (
                      <div className="w-2 h-2 flex-shrink-0" />
                    )}

                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-0.5">
                        <p className={`font-semibold truncate ${contact.hasUnread ? 'text-gray-900' : 'text-gray-900'}`}>
                          {getDisplayName(contact.contextData?.name || null, contact.displayName, contact.phoneNumber)}
                        </p>
                        {contact.lastMessageTimestamp && (
                          <span className={`text-xs flex-shrink-0 ${contact.hasUnread ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                            {formatMessageDate(formatIMessageTimestamp(contact.lastMessageTimestamp))}
                          </span>
                        )}
                      </div>

                      {contact.lastMessageText ? (
                        <p className={`text-sm truncate ${contact.hasUnread ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                          {contact.lastMessageIsFromMe ? 'You: ' : ''}
                          {contact.lastMessageText}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No messages</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? 'No contacts found' : 'No contacts found. Make sure you have iMessage history.'}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedContact && selectedContactData ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {selectedContactData.contextData?.name || selectedContactData.displayName || selectedContact}
                  </h2>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500">{selectedContact}</p>
                    {selectedContactData.contextData?.relationshipType && (
                      <Badge variant="outline" className="text-xs">
                        {selectedContactData.contextData.relationshipType}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowContactContext(true)}
              >
                <Info className="w-4 h-4 mr-2" />
                Contact Info
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messagesLoading ? (
                <div className="text-center text-gray-500">Loading messages...</div>
              ) : messages && messages.length > 0 ? (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="max-w-xs lg:max-w-md">
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            message.isFromMe
                              ? 'bg-blue-500 text-white rounded-br-sm'
                              : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200'
                          }`}
                        >
                          {message.text ? (
                            <p className="text-sm">{message.text}</p>
                          ) : (
                            <p className="text-sm italic opacity-60">[Photo/Reaction/Attachment]</p>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1 px-2">
                          {formatMessageDate(formatIMessageTimestamp(message.timestamp))}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="text-center text-gray-500">No messages found</div>
              )}
            </div>

            {/* AI Suggestions Panel */}
            <AISuggestions
              contactPhone={selectedContact}
              contactName={selectedContactData.contextData?.name || selectedContactData.displayName}
              messages={messages || []}
            />

            {/* Contact Context Dialog */}
            <ContactContextDialog
              open={showContactContext}
              onOpenChange={setShowContactContext}
              contactPhone={selectedContact}
              contactName={selectedContactData.contextData?.name || selectedContactData.displayName}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Select a Conversation
              </h2>
              <p className="text-gray-500 mb-4">
                Choose a contact from the sidebar to view messages and get AI suggestions
              </p>
              <Button variant="outline" onClick={() => setShowUserContext(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Set Your Status
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* User Context Panel */}
      <UserContextPanel open={showUserContext} onOpenChange={setShowUserContext} />
    </div>
  );
}
