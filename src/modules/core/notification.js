import firebaseadmin from 'firebase-admin';

export const buyerNotification = {
  MSG: {
    title: 'Komuto',
    body: 'Anda memiliki pesan baru',
    type: 'BUYER_MESSAGE',
  },
};

export const sellerNotification = {
  MSG: {
    title: 'Komuto',
    body: 'Anda memiliki pesan baru',
    type: 'SELLER_MESSAGE',
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
