const { v4: uuidv4 } = require('uuid');

let users = [
  {
    id: '122675',
    username: 'krisu',
    password: '$2a$06$qTZfR8O4zk6CpgdS2/cOg.l5ueMnbG9IPkHHnic5DoJOTO0I/1c/S'
  }
];
let posts = [
    {
        id: "25280",
        ownerId: "11",
        title: "string",
        description: "string",
        category: "cars",
        location: "helsinki",
        images: [
          "string"
        ],
        price: 0,
        date: "2021-10-06T08:35:23.003Z",
        deliveryType: "pickup",
        contactInfo: "Krisu, 04569569823"
      },
      {
        id: "15690",
        ownerId: "11",
        title: "string",
        description: "string",
        category: "toys",
        location: "helsinki",
        images: [
          "string"
        ],
        price: 0,
        date: "2021-10-02T08:35:23.003Z",
        deliveryType: "pickup",
        contactInfo: "Jukka, 05040569211"
      },
      {
        id: "23250",
        ownerId: "18",
        title: "string",
        description: "string",
        category: "toys",
        location: "oulu",
        images: [
          "string"
        ],
        price: 0,
        date: "2021-10-11T08:35:23.003Z",
        deliveryType: "pickup",
        contactInfo: "Pirkko, 04036569283"
      }
]


module.exports = {
    addUser: (user) => {
      user.id = uuidv4();
      users.push(user);
    },
    getUsers: () => {
      return users;
    },
    // look for a user if it exists
    getUserByName: (username) => users.find(user => user.username == username),

    addPost: (post) => {
      const postWithId = { id: uuidv4(), ...post};
      posts.push(postWithId);
    },
    // Search posts
    getPostById: (postId) => posts.find(post => post.id == postId),

    getPostByCriteria: (criteria) => {
      let filteredPosts = posts.filter(criteriaCheck(criteria))
      // Sorting
      if (criteria.sortByDate != undefined) {
        filteredPosts.sort((a, b) => {
          const isTrueSet = (criteria.sortByDate === 'true');
          return (new Date(b.date).getTime() / 1000 - new Date(a.date).getTime() / 1000) * (isTrueSet ? 1 : -1);
        })
      }
      return filteredPosts;
    },

    // Modify posts
    updatePostById: (postId, updatedProps) => {
      const post = module.exports.getPostById(postId);
      const newPost = {...post, ...updatedProps};
      module.exports.deletePostById(postId);
      posts.push(newPost);
    },

    deletePostById: (postId) => {
      for (let i = 0; i < posts.length; i++) {
        if (posts[i].id == postId) {
          posts.splice(i, 1);
          break;
        }
      }
    }
}

const criteriaCheck = (criteria) => {
  return (post) => {
    let isValid = true;
    for (let prop in criteria) {
      if (prop == "sortByDate" || criteria[prop] == undefined) continue;
      if (post[prop] != criteria[prop]) {
        isValid = false;
        break;
      }
    }
    return isValid;
  }
}

/* 

criteria = {
    category: null or string,
    location: null or string,
    sortByDate: true or false,
    username: null or string
}

*/