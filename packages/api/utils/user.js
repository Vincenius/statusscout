export const mapUser = (user) => {
  return {
    email: user.email,
    subscription: user.subscription,
    notificationChannels: user.notificationChannels
      ? user.notificationChannels.map(c => ({ type: c.type, value: c.value, verified: c.verified, id: c.id }))
      : [],
    confirmed: user.confirmed,
    isProUser: isProUser(user),
    websiteLimit: getWebsiteLimit(user),
  };
};

export const isProUser = (user) => {
  return user.subscription && (user.subscription.plan === 'pro' || user.subscription.plan === 'trial' || user.subscription.plan === 'agency')
    && (!user.subscription.expiresAt || (new Date(user.subscription.expiresAt) > new Date()));
}

export const getWebsiteLimit = (user) => {
  return user?.subscription?.plan === 'agency' ? 20 : 5;
}

export const getFlowLimit = (user) => {
  return user?.subscription?.plan === 'agency' ? 20 : 10;
}

// middleware for protected routes
export const hasActivePlan = async (request, reply) => {
  const user = request.user;

  if (!isProUser(user)) {
    reply.code(402).send({ error: 'Active plan required' });
    return;
  }
}
