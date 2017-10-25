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
  RESOLUTION: {
    title: 'Komuto',
    body: 'Penjual mengomentari pusat resolusi',
    type: 'BUYER_RESOLUTION',
  },
};

class NotificationClass {
  static getPayload(notification, params) {
    const { id = null, product_id: productId = null } = params;
    const data = { type: notification.type };
    if (id) data.id = String(id);
    if (productId) data.product_id = String(productId);
    data.custom_notification = JSON.stringify({
      ...data,
      title: notification.title,
      body: notification.body,
      content_available: true,
      priority: 'high',
      show_in_foreground: true,
    });
    return {
      notification: {
        title: notification.title,
        body: notification.body,
        content_available: 'true',
        priority: 'high',
      },
      data,
    };
  }

  static send(notification, params) {
    const { token } = params;
    const payload = this.getPayload(notification, params);
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
