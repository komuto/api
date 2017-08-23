import firebaseadmin from 'firebase-admin';

export const sellerNotification = {
  MESSAGE: {
    title: 'Komuto',
    body: 'Anda memiliki pesan baru',
    type: 'SELLER_MESSAGE',
  },
  DISCUSSION: {
    title: 'Komuto',
    body: 'Anda memiliki diskusi baru',
    type: 'SELLER_DISCUSSION',
  },
  REVIEW: {
    title: 'Komuto',
    body: 'Anda memiliki review baru',
    type: 'SELLER_REVIEW',
  },
  RESOLUTION: {
    title: 'Komuto',
    body: 'Anda memiliki resolusi baru',
    type: 'SELLER_RESOLUTION',
  },
};

export const buyerNotification = {
  MESSAGE: {
    title: 'Komuto',
    body: 'Anda memiliki pesan baru',
    type: 'BUYER_MESSAGE',
  },
  DISCUSSION: {
    title: 'Komuto',
    body: 'Penjual mengomentari diskusi anda',
    type: 'BUYER_DISCUSSION',
  },
  REVIEW: {
    title: 'Komuto',
    body: 'Penjual mengomentari review anda',
    type: 'BUYER_REVIEW',
  },
  RESOLUTION: {
    title: 'Komuto',
    body: 'Penjual mengomentari pusat resolusi',
    type: 'BUYER_RESOLUTION',
  },
};

class NotificationClass {
  static getPayload(notification) {
    return {
      notification: { title: notification.title, body: notification.body },
      data: { type: notification.type },
    };
  }

  static send(notification, token) {
    const payload = this.getPayload(notification);
    firebaseadmin.messaging().sendToDevice(token, payload)
      .then((response) => {
        console.log('Successfully sent message:');
        console.logFull(response);
      })
      .catch((error) => {
        console.log('Error sending message:');
        console.logFull(error);
      });
  }
}

export const Notification = NotificationClass;
