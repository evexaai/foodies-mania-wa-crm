"use strict";
/* ================= Foodies Mania: the one menu everything reads =================
   The website, the chat widget and the chat-to-order page all read this file,
   and the CRM receives orders by item name, so a name here is what the kitchen
   sees. Prices and items are from the Foodies Mania menu cards and offer posters
   (assets/Updated Menu). Photos are Pexels stock
   (free licence), downloaded into assets/food/<id>.webp by tools/fetch-images.py.

   item: id, cat, name, price, img, desc, sizes?[[label,price]], tag?, alias?[], crm? (CRM category)
   A sized item's price is its smallest size.                                    */

const FM_BIZ={
  name:'Foodies Mania',
  tagline:'Have some more!',
  phone:'021-37226172',
  takeaway:'0312-0755760',
  email:'shahnawazdamani5@gmail.com',
  addr:'Shop 1, R12, Block 8, Federal B Area, Alyabad, near Tabba Heart Hospital, Karachi',
  hours:'Every day · 6 PM to 5 AM',
  open:18, close:5,                /* 24h clock; closes after midnight */
  insta:'https://www.instagram.com/foodiesmania20/',
  instaHandle:'@foodiesmania20',
  map:'https://maps.google.com/?q=Foodies+Mania+Block+8+Federal+B+Area+Karachi',
  eta:'35 to 45 min', pickupEta:'20 to 25 min'
};

const FM_CATS=[
  {id:'deal',name:'Deals'},
  {id:'bbqdeal',name:'BBQ Deals'},
  {id:'burger',name:'Burgers'},
  {id:'special-pizza',name:'Foodies Special Pizza'},
  {id:'pizza',name:'Pizza Flavours'},
  {id:'sig',name:'Signature Pizza'},
  {id:'roll',name:'Rolls'},
  {id:'bbq',name:'Bar Be Que'},
  {id:'fries',name:'Fries & Garlic Bread'},
  {id:'special',name:'Our Specials'},
  {id:'juice',name:'Fresh Juices'},
  {id:'shake',name:'Shakes'},
  {id:'dessert',name:'Ice Cream & Faluda'},
  {id:'addon',name:'Drinks & Add-ons'}
];

/* the CRM keeps fewer categories than the website */
const FM_CRM_CAT={'bbqdeal':'deal','special-pizza':'pizza','juice':'drink','shake':'drink','dessert':'drink','addon':'drink'};

const PZ=[['Small',350],['Medium',550],['Large',900]];      /* pizza flavours */
const SPZ=[['Small',400],['Medium',600],['Large',950]];     /* Foodies special pizza */
const CHZ=n=>[['Regular',n],['With cheese',n+50]];          /* burgers that take a cheese slice */
const SCOOP=[['Single scoop',120],['Double scoop',200]];
const TOP=[['Small',50],['Regular',70],['Large',100]];      /* extra topping, by pizza size */
const PICK=' Pizza flavour of your choice; add it in the note.';

/* From the Foodies Mania menu card (deals, BBQ, rolls, pizza, burgers, specials,
   add-ons), the drinks & desserts card, and the current offer posters. */
const FM_ITEMS=[
 /* ---------- deals (menu card, Deal 1 to 22) ---------- */
 {id:'d-ff1',cat:'deal',name:'Deal 1',price:700,img:'cv-d-ff1',desc:'2 Chicken Burgers, 2 Drinks 345ml.',alias:['deal 1','deal one']},
 {id:'d-ff2',cat:'deal',name:'Deal 2',price:750,img:'cv-d-ff2',desc:'2 Zinger Burgers and Fries.',alias:['deal 2','deal two']},
 {id:'d-ff3',cat:'deal',name:'Deal 3',price:850,img:'cv-d-ff3',desc:'1 Zinger Burger, 1 Small Pizza Fries, 1 Drink 345ml and Fries.',alias:['deal 3','deal three']},
 {id:'d-ff4',cat:'deal',name:'Deal 4',price:1000,img:'cv-d-ff4',desc:'3 Beef Burgers, 1 Cold Drink 1 Ltr.',alias:['deal 4','deal four']},
 {id:'d-ff5',cat:'deal',name:'Deal 5',price:900,img:'cv-d-ff5',desc:'1 Zinger Burger, 1 Club Sandwich, 2 Drinks 345ml.',alias:['deal 5','deal five']},
 {id:'d-ff6',cat:'deal',name:'Deal 6',price:1000,img:'cv-d-ff6',desc:'3 Chicken Burgers, 1 Cold Drink 1 Ltr.',alias:['deal 6','deal six']},
 {id:'d-ff7',cat:'deal',name:'Deal 7',price:1050,img:'cv-d-ff7',desc:'1 Large Pizza, 2 Garlic Bread, 1 Drink 345ml.'+PICK,alias:['deal 7','deal seven']},
 {id:'d-ff8',cat:'deal',name:'Deal 8',price:1150,img:'cv-d-ff8',desc:'2 Large Pizza Fries, 1 Small Pizza Fries.',alias:['deal 8','deal eight']},
 {id:'d-ff9',cat:'deal',name:'Deal 9',price:1250,img:'cv-d-ff9',desc:'3 Zinger Burgers, 1 Cold Drink 1 Ltr.',alias:['deal 9','deal nine']},
 {id:'d-ff10',cat:'deal',name:'Deal 10',price:1150,img:'cv-d-ff10',desc:'2 Regular Pizzas, 1 Drink 1 Ltr.'+PICK,alias:['deal 10','deal ten']},
 {id:'d-ff11',cat:'deal',name:'Deal 11',price:1200,img:'cv-d-ff11',desc:'1 Zinger Burger, 1 Club Sandwich, 1 Chicken Burger, 1 Drink 1 Ltr.',alias:['deal 11']},
 {id:'d-ff12',cat:'deal',name:'Deal 12',price:1250,img:'cv-d-ff12',desc:'2 Zinger Burgers, 1 Club Sandwich, 1 Drink 1 Ltr.',alias:['deal 12']},
 {id:'d-ff13',cat:'deal',name:'Deal 13',price:1350,img:'cv-d-ff13',desc:'1 Large Pizza, 1 Zinger Burger, 2 Drinks 345ml.'+PICK,alias:['deal 13']},
 {id:'d-ff14',cat:'deal',name:'Deal 14',price:1650,img:'cv-d-ff14',desc:'3 Regular Pizzas, 1 Cold Drink 1 Ltr.'+PICK,alias:['deal 14']},
 {id:'d-ff15',cat:'deal',name:'Deal 15',price:1650,img:'cv-d-ff15',desc:'1 Large Pizza, 1 Zinger Burger, 1 Large Pizza Fries, 1 Drink 345ml.'+PICK,alias:['deal 15']},
 {id:'d-ff16',cat:'deal',name:'Deal 16',price:1600,img:'cv-d-ff16',desc:'2 Large Pizzas.'+PICK,alias:['deal 16']},
 {id:'d-ff17',cat:'deal',name:'Deal 17',price:1700,img:'cv-d-ff17',desc:'1 Large Pizza, 2 Zinger Burgers, 2 Drinks 345ml.'+PICK,alias:['deal 17']},
 {id:'d-ff18',cat:'deal',name:'Deal 18',price:1950,img:'cv-d-ff18',desc:'5 Zinger Burgers, 1 Drink 1.5 Ltr.',alias:['deal 18']},
 {id:'d-ff19',cat:'deal',name:'Deal 19',price:1800,img:'cv-d-ff19',desc:'2 Large Pizzas, 4 Garlic Bread, 1 Drink 1 Ltr.'+PICK,alias:['deal 19']},
 {id:'d-ff20',cat:'deal',name:'Deal 20',price:2400,img:'cv-d-ff20',desc:'2 Large Pizzas, 2 Zinger Burgers, 1 Drink 1.5 Ltr.'+PICK,alias:['deal 20']},
 {id:'d-ff21',cat:'deal',name:'Deal 21',price:2750,img:'cv-d-ff21',desc:'3 Large Pizzas, 4 Garlic Bread, 1 Drink 1.5 Ltr.'+PICK,alias:['deal 21']},
 {id:'d-ff22',cat:'deal',name:'Deal 22',price:3300,img:'cv-d-ff22',tag:'Party',desc:'4 Large Pizzas, 2 Drinks 1 Ltr.'+PICK,alias:['deal 22']},
 /* ---------- offers (posters) ---------- */
 {id:'d-family',cat:'deal',name:'Family Platter',price:2400,img:'cv-d-family',tag:'Deal of the month',desc:'1 Regular Pizza, 2 Special Zinger Burgers, 1 Small Pizza Fries, 1 French Roll, 1 Club Sandwich.',alias:['family platter','family deal','family']},
 {id:'d-couple',cat:'deal',name:'Couple Deal',price:1100,img:'cv-d-couple',desc:'1 Medium Pizza, 1 Zinger Burger, 2 Drinks 500ml.'+PICK,alias:['couple','couple deal']},
 {id:'d-one',cat:'deal',name:'1 Person Deal',price:600,img:'cv-d-one',desc:'1 Regular Pizza with a 500ml drink.'+PICK,alias:['one person','single deal','1 person']},
 {id:'d-block',cat:'deal',name:'Blockbuster Deal',price:1350,img:'cv-d-block',tag:'Popular',desc:'1 Large Pizza, 1 Zinger Burger, 1 Pizza Fries.'+PICK,alias:['blockbuster','block buster']},
 {id:'d-jumper',cat:'deal',name:'Jumper Deal',price:650,img:'cv-d-jumper',desc:'1 Zinger Burger, 1 pc Dostick Fries and a cold drink.',alias:['jumper']},
 {id:'d-cjumper',cat:'deal',name:'Combo Jumper Deal',price:1200,img:'cv-d-cjumper',desc:'2 Zinger Burgers, 2 pcs Dostick Fries and 2 Drinks 500ml.',alias:['combo jumper']},
 {id:'d-zinger3',cat:'deal',name:'3 Zinger Burger Deal',price:1200,img:'cv-d-zinger3',desc:'Any 3: BBQ Smoke, Steak, Ranch, Hot Chek Chek, Mighty, Chilli Sriracha or Italian. Add your picks in the note.',alias:['3 zinger','three zinger','zinger deal']},
 {id:'d-3small',cat:'deal',name:'3 Small Pizza Deal',price:1100,img:'cv-d-3small',desc:'3 Small Pizzas with a 1 Ltr drink. Limited offer.'+PICK,alias:['3 small pizza','three small pizza']},
 {id:'d-summer',cat:'deal',name:'Summer Signature Deal',price:1750,img:'cv-d-summer',desc:'1 Large Pizza, 1 Medium Pizza, 1 Small Pizza Fries, 1 Ltr drink.'+PICK,alias:['summer deal','summer signature']},
 {id:'d-monsoon',cat:'deal',name:'Monsoon Deal',price:900,img:'cv-d-monsoon',desc:'1 Medium Pizza, 1 Small Pizza Fries and a free 500ml drink.'+PICK,alias:['monsoon','rainy deal']},
 {id:'d-tikka',cat:'deal',name:'Chicken Tikka Combo',price:950,img:'cv-d-tikka',desc:'2 Chicken Tikka (Leg), 2 Large Parathas, 1 Ltr drink.',alias:['tikka combo']},
 {id:'d-win1',cat:'deal',name:'Winter Night Deal 1',price:650,img:'cv-d-win1',desc:'3 Chicken Rolls, 1 Ltr drink.',alias:['winter deal 1','winter night 1']},
 {id:'d-win2',cat:'deal',name:'Winter Night Deal 2',price:1000,img:'cv-d-win2',desc:'2 Zinger Burgers, 1 Pizza Fries and Fries.',alias:['winter deal 2','winter night 2']},
 {id:'d-win3',cat:'deal',name:'Winter Night Deal 3',price:1650,img:'cv-d-win3',desc:'3 Chicken Rolls, 1 Ltr drink, 2 Zinger Burgers, 1 Pizza Fries and Fries.',alias:['winter deal 3','winter night 3']},

 /* ---------- BBQ deals ---------- */
 {id:'d-bbq1',cat:'bbqdeal',name:'BBQ Deal 1',price:550,img:'cv-d-bbq1',desc:'1 Chicken Tikka (Leg), 1 Small Paratha, 1 Kabab Roll.',alias:['bbq deal 1']},
 {id:'d-bbq2',cat:'bbqdeal',name:'BBQ Deal 2',price:1000,img:'cv-d-bbq2',desc:'2 Bihari Tikka (Chest), 2 Large Parathas.',alias:['bbq deal 2']},
 {id:'d-bbq3',cat:'bbqdeal',name:'BBQ Deal 3',price:900,img:'cv-d-bbq3',desc:'5 Chicken Rolls.',alias:['bbq deal 3','5 chicken roll']},
 {id:'d-bbq4',cat:'bbqdeal',name:'BBQ Deal 4',price:1000,img:'cv-d-bbq4',desc:'Half Reshmi Kabab, Half Gola Kabab, Half Chicken Boti, Half Beef Boti, 4 Small Parathas.',alias:['bbq deal 4']},
 {id:'d-bbq5',cat:'bbqdeal',name:'BBQ Deal 5',price:2900,img:'cv-d-bbq5',tag:'Family feast',desc:'Chicken Malai Boti, Chicken Boti, Beef Boti, Reshmi Kabab, Gola Kabab, Bihari Tikka (Leg), Dhaga Kabab and 7 Large Parathas.',alias:['bbq deal 5','bbq platter','bbq family']},
 {id:'d-bbq6',cat:'bbqdeal',name:'BBQ Deal 6',price:800,img:'cv-d-bbq6',desc:'3 Zinger Rolls, 1 Ltr drink.',alias:['bbq deal 6']},

 /* ---------- burgers ---------- */
 {id:'b-zinger',cat:'burger',name:'Zinger Burger',price:400,sizes:CHZ(400),img:'cv-b-zinger',tag:'Bestseller',desc:'Hand-breaded crispy chicken fillet, crunchy lettuce and creamy house mayo. Add a cheese slice for Rs 50.',alias:['zinger','zingar','zinger cheese','cheese zinger']},
 {id:'b-chicken',cat:'burger',name:'Chicken Burger',price:300,sizes:CHZ(300),img:'cv-b-chicken',desc:'Juicy chicken patty, lettuce and mayo. Add a cheese slice for Rs 50.',alias:['chicken burger','chicken cheese burger']},
 {id:'b-beef',cat:'burger',name:'Beef Burger',price:300,sizes:CHZ(300),img:'cv-b-beef',desc:'Grilled beef patty with fresh veg and our signature sauce. Add a cheese slice for Rs 50.',alias:['beef burger','beef cheese burger']},
 {id:'b-mighty',cat:'burger',name:'Mighty Burger',price:450,img:'cv-b-mighty',tag:'Bestseller',desc:'Double the crunch, double the sauce. A towering crispy chicken stack.',alias:['mighty']},
 {id:'b-bbqsmoke',cat:'burger',name:'BBQ Smoke Burger',price:450,img:'cv-b-bbqsmoke',desc:'Smoky BBQ glaze, melted cheese and a juicy patty.',alias:['bbq burger','smoke burger','bbq smoke']},
 {id:'b-steak',cat:'burger',name:'Steak Burger',price:450,img:'cv-b-steak',desc:'Seasoned steak patty, fresh veg and steak sauce.',alias:['steak']},
 {id:'b-ranch',cat:'burger',name:'Ranch Burger',price:450,img:'cv-b-ranch',desc:'Crispy chicken bathed in cool, herby ranch.',alias:['ranch']},
 {id:'b-chek',cat:'burger',name:'Hot Chek Chek Burger',price:450,img:'cv-b-chek',tag:'Spicy',desc:'Crispy chicken with green chillies and our hot chek-chek sauce.',alias:['chek chek','hot chek']},
 {id:'b-sriracha',cat:'burger',name:'Chilli Sriracha Burger',price:450,img:'cv-b-sriracha',tag:'Spicy',desc:'Sweet-hot sriracha, melted cheese and a crunchy fillet.',alias:['sriracha','chilly sriracha','chilli burger']},
 {id:'b-italian',cat:'burger',name:'Italian Burger',price:450,img:'cv-b-italian',desc:'Herb-seasoned patty, tomato, mozzarella and Italian dressing.',alias:['italian']},
 {id:'b-smash',cat:'burger',name:'Smash Burger',price:450,img:'cv-b-smash',desc:'Beef patties smashed thin for crispy edges, with melted cheese.',alias:['smash']},
 {id:'b-smashs',cat:'burger',name:'Smash Spicy Burger',price:450,img:'cv-b-smashs',tag:'Spicy',desc:'The Smash, turned up: jalapeños, fiery sauce and gooey cheese.',alias:['spicy smash']},

 /* ---------- Foodies special pizza ---------- */
 {id:'sp-peri',cat:'special-pizza',name:'Peri Peri Pizza',price:400,sizes:SPZ,img:'cv-sp-peri',tag:'Spicy',desc:'Peri peri chicken, onions, jalapeños and bubbling mozzarella.',alias:['peri peri','peri']},
 {id:'sp-supmax',cat:'special-pizza',name:'Supreme Max Pizza',price:400,sizes:SPZ,img:'cv-sp-supmax',desc:'Loaded to the edge: chicken, peppers, onions and extra cheese.',alias:['supreme max']},
 {id:'sp-bonfire',cat:'special-pizza',name:'Bonfire Pizza',price:400,sizes:SPZ,img:'cv-sp-bonfire',desc:'Smoky fire-grilled chicken with onions and a hit of chilli.',alias:['bonfire']},
 {id:'sp-tartar',cat:'special-pizza',name:'Tautar Sauce Pizza',price:400,sizes:SPZ,img:'cv-sp-tartar',desc:'Spiced chicken under a lattice of creamy tartar sauce.',alias:['tartar','tautar']},
 {id:'sp-ranch',cat:'special-pizza',name:'Ranch Pizza',price:400,sizes:SPZ,img:'cv-sp-ranch',desc:'Chicken, mozzarella and cool ranch drizzle.',alias:['ranch pizza']},
 {id:'sp-scary',cat:'special-pizza',name:'Special Spicy & Saucy Pizza',price:400,sizes:SPZ,img:'cv-sp-scary',tag:'Spicy',desc:'Jalapeños, hot sauce and fiery chicken, extra saucy.',alias:['spicy saucy','spicy and saucy']},
 {id:'sp-achari',cat:'special-pizza',name:'Special Achari Pizza',price:400,sizes:SPZ,img:'cv-sp-achari',desc:'Tangy achari-spiced chicken. Desi flavour on an Italian base.',alias:['achari']},
 {id:'sp-mughlai',cat:'special-pizza',name:'Special Mughlai Pizza',price:400,sizes:SPZ,img:'cv-sp-mughlai',desc:'Rich mughlai chicken, sweetcorn and creamy drizzle.',alias:['mughlai']},
 {id:'sp-butter',cat:'special-pizza',name:'Butter Chicken Pizza',price:400,sizes:SPZ,img:'cv-sp-butter',desc:'Velvety butter chicken on golden, cheesy pizza.',alias:['butter chicken']},

 /* ---------- pizza flavours ---------- */
 {id:'p-tandoori',cat:'pizza',name:'Chicken Tandoori Pizza',price:350,sizes:PZ,img:'cv-p-tandoori',desc:'Smoky tandoori chicken, onions and green chillies.',alias:['tandoori']},
 {id:'p-fajita',cat:'pizza',name:'Chicken Fajita Pizza',price:350,sizes:PZ,img:'cv-p-fajita',tag:'Popular',desc:'Fajita chicken, capsicum, onion and jalapeño on a cheesy base.',alias:['fajita']},
 {id:'p-hot',cat:'pizza',name:'Chicken Hot & Spicy Pizza',price:350,sizes:PZ,img:'cv-p-hot',tag:'Spicy',desc:'Hot chicken, green chillies and peppers.',alias:['hot and spicy','hot spicy']},
 {id:'p-shawarma',cat:'pizza',name:'Chicken Shawarma Pizza',price:350,sizes:PZ,img:'cv-p-shawarma',desc:'Shawarma-spiced chicken, garlic sauce and peppers.',alias:['shawarma pizza']},
 {id:'p-supreme',cat:'pizza',name:'Chicken Supreme Pizza',price:350,sizes:PZ,img:'cv-p-supreme',desc:'Chicken, olives, capsicum, onions and mushrooms.',alias:['chicken supreme','supreme']},
 {id:'p-tikka',cat:'pizza',name:'Chicken Tikka Pizza',price:350,sizes:PZ,img:'cv-p-tikka',tag:'Popular',desc:'Charred chicken tikka, onions and tikka sauce.',alias:['tikka pizza']},
 {id:'p-malai',cat:'pizza',name:'Chicken Malai Boti Pizza',price:350,sizes:PZ,img:'cv-p-malai',desc:'Creamy malai boti chunks on a cheesy base.',alias:['malai boti pizza']},
 {id:'p-bihari',cat:'pizza',name:'Chicken Bihari Pizza',price:350,sizes:PZ,img:'cv-p-bihari',desc:'Bihari-spiced chicken with onions.',alias:['bihari pizza']},
 {id:'p-afghani',cat:'pizza',name:'Chicken Afghani Pizza',price:350,sizes:PZ,img:'cv-p-afghani',desc:'Mild, creamy afghani chicken.',alias:['afghani']},
 {id:'p-salsa',cat:'pizza',name:'Spanish Salsa Pizza',price:350,sizes:PZ,img:'cv-p-salsa',desc:'Zesty salsa, sweetcorn and chicken.',alias:['spanish salsa','salsa']},
 {id:'p-italian',cat:'pizza',name:'Italian Classic Pizza',price:350,sizes:PZ,img:'cv-p-italian',desc:'Tomato, basil and mozzarella. Simple perfection.',alias:['italian classic','margherita']},
 {id:'p-meat',cat:'pizza',name:'Meat Lover Pizza',price:350,sizes:PZ,img:'cv-p-meat',desc:'Beef pepperoni, chicken and more meat, with olives and cheese.',alias:['meat lover','meat']},
 {id:'p-cheese',cat:'pizza',name:'Cheese Lover Pizza',price:350,sizes:PZ,img:'cv-p-cheese',desc:'All about the cheese. Golden, bubbling, stretchy mozzarella.',alias:['cheese lover','cheese pizza']},
 {id:'p-pepperoni',cat:'pizza',name:'Asian Beef Pepperoni Pizza',price:350,sizes:PZ,img:'cv-p-pepperoni',desc:'Classic beef pepperoni, edge to edge.',alias:['pepperoni']},
 {id:'p-mayo',cat:'pizza',name:'Mayo Lover Pizza',price:350,sizes:PZ,img:'cv-p-mayo',desc:'Creamy mayo, chicken and herbs.',alias:['mayo lover']},
 {id:'p-veg',cat:'pizza',name:'Vegetable Pizza',price:350,sizes:PZ,img:'cv-p-veg',desc:'Garden-fresh veg on a crisp base.',alias:['veg pizza','vegetable']},
 {id:'p-arabian',cat:'pizza',name:'Arabian Pizza',price:350,sizes:PZ,img:'cv-p-arabian',desc:'Middle-Eastern spiced chicken with garlic sauce.',alias:['arabian']},
 {id:'p-feast',cat:'pizza',name:'Arabian Feast Pizza',price:350,sizes:PZ,img:'cv-p-feast',desc:'The Arabian, upgraded with extra toppings.',alias:['arabian feast']},
 {id:'p-bbqtikka',cat:'pizza',name:'BBQ Tikka Pizza',price:350,sizes:PZ,img:'cv-p-bbqtikka',desc:'BBQ tikka chicken under golden cheese.',alias:['bbq tikka pizza','bbq pizza']},
 {id:'p-fajsens',cat:'pizza',name:'Fajita Sensation Pizza',price:350,sizes:PZ,img:'cv-p-fajsens',desc:'Fajita chicken plus olives and mushrooms.',alias:['fajita sensation']},
 {id:'p-fiesta',cat:'pizza',name:'Chicken Fiesta Pizza',price:350,sizes:PZ,img:'cv-p-fiesta',desc:'A party of chicken, peppers and spices.',alias:['fiesta']},
 {id:'p-creamy',cat:'pizza',name:'Creamy Cheese Pizza',price:350,sizes:PZ,img:'cv-p-creamy',desc:'Creamy white sauce and loads of cheese.',alias:['creamy cheese']},
 {id:'p-supcreamy',cat:'pizza',name:'Super Creamy Pizza',price:350,sizes:PZ,img:'cv-p-supcreamy',desc:'Extra creamy white sauce, chicken and cheese.',alias:['super creamy','supreme creamy']},

 /* ---------- signature pizza ---------- */
 {id:'s-chipotle',cat:'sig',name:'Chipotle Kabab Pizza',price:1100,img:'cv-s-chipotle',desc:'Kabab pieces in smoky chipotle sauce on a hand-stretched base.',alias:['chipotle','chipotle kabab']},
 {id:'s-seekh',cat:'sig',name:'Chicken Seekh Kabab Pizza',price:1100,img:'cv-s-seekh',desc:'Juicy seekh kabab slices, onion and cheese.',alias:['seekh kabab pizza','seekh pizza']},
 {id:'s-sausage',cat:'sig',name:'Supreme Sausages Pizza',price:1100,img:'cv-s-sausage',desc:'Chicken sausages, peppers, olives and corn.',alias:['sausage','sausages','supreme sausages']},
 {id:'s-crust',cat:'sig',name:'Pizza Crust',price:1400,img:'cv-s-crust',tag:'Cheesy',desc:'Stuffed-crust indulgence. Hot, spicy, cheesy and yummy.',alias:['crust','stuffed crust','pizza crust']},
 {id:'s-calzone',cat:'sig',name:'Calzone 2 Pizza',price:1000,img:'cv-s-calzone',desc:'Mouth-melting calzone, folded and baked golden.',alias:['calzone','calizone']},
 {id:'s-4flav',cat:'sig',name:'4 Flavours in 1 Pizza',price:1000,img:'cv-s-4flav',desc:'Can’t decide? Four flavours on one pizza.',alias:['4 flavour','four flavour','4 flavours']},

 /* ---------- rolls ---------- */
 {id:'r-zinger',cat:'roll',name:'Zinger Roll',price:280,img:'cv-r-zinger',tag:'Bestseller',desc:'Crispy zinger strips, garlic mayo and salad rolled in a flaky paratha.',alias:['zinger roll','zinga roll']},
 {id:'r-reshmi',cat:'roll',name:'Reshmi Kabab Roll',price:180,sizes:[['Small',180],['Large',280]],img:'cv-r-reshmi',desc:'Silky reshmi kabab, wrapped warm.',alias:['reshmi roll','reshmi kabab roll']},
 {id:'r-malai',cat:'roll',name:'Malai Boti Roll',price:220,sizes:[['Small',220],['Large',320]],img:'cv-r-malai',desc:'Creamy malai boti, mint chutney and onions in paratha.',alias:['malai boti roll','malai roll']},
 {id:'r-beefboti',cat:'roll',name:'Beef Boti Roll',price:200,sizes:[['Small',200],['Large',300]],img:'cv-r-beefboti',desc:'Tender beef boti, onions and chutney.',alias:['beef boti roll','beef roll']},
 {id:'r-boti',cat:'roll',name:'Chicken Boti Roll',price:200,sizes:[['Small',200],['Large',300]],img:'cv-r-boti',desc:'Smoky chicken boti and chutney in a hot paratha.',alias:['chicken boti roll','boti roll','chicken roll']},
 {id:'r-mayo',cat:'roll',name:'Chicken Mayo Roll',price:220,sizes:[['Small',220],['Large',320]],img:'cv-r-mayo',desc:'Chicken with lashings of mayo.',alias:['mayo roll']},
 {id:'r-beefkabab',cat:'roll',name:'Beef Kabab Roll',price:180,sizes:[['Small',180],['Large',260]],img:'cv-r-beefkabab',desc:'Beef kabab, onions and chutney.',alias:['beef kabab roll','kabab roll']},

 /* ---------- bar be que ---------- */
 {id:'q-tikka',cat:'bbq',name:'Chicken Tikka',price:350,sizes:[['Leg',350],['Chest',430]],img:'cv-q-tikka',tag:'Bestseller',desc:'Marinated overnight, charcoal-grilled and served sizzling.',alias:['tikka','chicken tikka']},
 {id:'q-malaitikka',cat:'bbq',name:'Malai Tikka',price:400,sizes:[['Leg',400],['Chest',450]],img:'cv-q-malaitikka',desc:'Cream-marinated tikka, mild and melting.',alias:['malai tikka']},
 {id:'q-cheesytikka',cat:'bbq',name:'Cheesy Tikka',price:400,sizes:[['Leg',400],['Chest',450]],img:'cv-q-cheesytikka',desc:'Tikka finished with a cheesy glaze.',alias:['cheesy tikka']},
 {id:'q-boti',cat:'bbq',name:'Chicken Boti',price:400,img:'cv-q-boti',desc:'Spicy chicken boti with charred edges.',alias:['chicken boti','boti']},
 {id:'q-malaiboti',cat:'bbq',name:'Chicken Malai Boti',price:450,img:'cv-q-malaiboti',desc:'Creamy, buttery chicken boti straight off the coals.',alias:['malai boti']},
 {id:'q-beefboti',cat:'bbq',name:'Beef Boti',price:400,img:'cv-q-beefboti',desc:'Tender beef cubes, grilled over charcoal.',alias:['beef boti']},
 {id:'q-behari',cat:'bbq',name:'Beef Bihari Boti',price:400,img:'cv-q-behari',desc:'Thin, spice-rubbed Bihari beef, slow-grilled.',alias:['behari','bihari boti']},
 {id:'q-seekh',cat:'bbq',name:'Seekh Kabab',price:400,img:'cv-q-seekh',desc:'Hand-pressed minced kababs, smoky and juicy.',alias:['seekh','seekh kabab']},
 {id:'q-dhaga',cat:'bbq',name:'Dhaga Kabab',price:400,img:'cv-q-dhaga',desc:'Thread-wrapped melt-in-the-mouth kabab.',alias:['dhaga']},
 {id:'q-gola',cat:'bbq',name:'Gola Kabab',price:400,img:'cv-q-gola',desc:'Soft, spicy gola kabab from the coals.',alias:['gola']},
 {id:'q-reshmi',cat:'bbq',name:'Reshmi Chicken Kabab',price:400,img:'cv-q-reshmi',desc:'Silky chicken kabab with a creamy marinade.',alias:['reshmi kabab','reshmi']},
 {id:'q-cheesykabab',cat:'bbq',name:'Cheesy Chicken Kabab',price:450,img:'cv-q-cheesykabab',desc:'Chicken kabab with a cheesy heart.',alias:['cheesy kabab']},
 {id:'q-chandan',cat:'bbq',name:'Chandan Kabab',price:450,img:'cv-q-chandan',desc:'A house favourite, rich and aromatic.',alias:['chandan']},
 {id:'q-fry',cat:'bbq',name:'Kabab Fry',price:500,img:'cv-q-fry',desc:'Kababs tossed hot on the tawa with onions and spice.',alias:['kabab fry']},

 /* ---------- fries & garlic bread ---------- */
 {id:'f-pizzafries',cat:'fries',name:'Pizza Fries',price:350,sizes:[['Small',350],['Large',450]],img:'cv-f-pizzafries',tag:'Bestseller',desc:'Crispy fries smothered in pizza sauce, chicken and melted cheese.',alias:['pizza fries']},
 {id:'f-mayo',cat:'fries',name:'Mayo Fries',price:200,img:'cv-f-mayo',desc:'Golden fries with garlic mayo.',alias:['mayo fries','mayoo fries']},
 {id:'f-plain',cat:'fries',name:'Plain Fries',price:150,img:'cv-f-plain',desc:'Crispy, salted, classic.',alias:['fries','plain fries','french fries']},
 {id:'f-garlic',cat:'fries',name:'Garlic Bread',price:100,sizes:[['2 pcs',100],['4 pcs',200]],img:'cv-f-garlic',desc:'Toasted, buttery garlic bread.',alias:['garlic bread','plain garlic bread']},
 {id:'f-garlicc',cat:'fries',name:'Cheesy Garlic Bread',price:150,sizes:[['2 pcs',150],['4 pcs',300]],img:'cv-f-garlicc',desc:'Garlic bread under a blanket of melted cheese.',alias:['cheesy garlic bread','cheese garlic bread']},

 /* ---------- our specials ---------- */
 {id:'x-pide',cat:'special',name:'Foodies Pide',price:650,img:'cv-x-pide',tag:'Foodies special',desc:'Turkish-style boat bread. Chicken, Veggie or Cheesy, or half and half. Pick yours in the note.',alias:['pide','foodies pide']},
 {id:'x-kuku',cat:'special',name:'Kuku Fries',price:1000,img:'cv-x-kuku',tag:'New',desc:'Grilled, juicy chicken with fries, buns, dips and cold drinks.',alias:['kuku','kuku fries']},
 {id:'x-lava',cat:'special',name:'Cheesy Lava',price:600,img:'cv-x-lava',tag:'Must try',desc:'Our special cheesy treat. Molten cheese that flows like lava.',alias:['lava','cheesy lava']},
 {id:'x-french',cat:'special',name:'French Roll',price:500,img:'cv-x-french',desc:'Toasted French roll packed with chicken. Dip sauce included.',alias:['french roll']},
 {id:'x-club',cat:'special',name:'Club Sandwich',price:400,img:'cv-x-club',desc:'Triple-decker club sandwich with extra fries.',alias:['club','club sandwich','clubsandwich']},
 {id:'x-mexican',cat:'special',name:'Mexican Sandwich',price:600,img:'cv-x-mexican',desc:'Grilled, spicy and stuffed. Special taste.',alias:['mexican','maxican']},
 {id:'x-pasta',cat:'special',name:'Pasta Super',price:600,img:'cv-x-pasta',desc:'Rich, creamy and cheesy baked pasta.',alias:['pasta','super pasta']},
 {id:'x-lasagna',cat:'special',name:'Lasagna',price:600,img:'cv-x-lasagna',desc:'Layered, baked and bubbling. Italian or Spanish.',alias:['lasagna','lasanga','lasania']},
 {id:'x-spaghetti',cat:'special',name:'Arabian Spaghetti',price:600,img:'cv-x-spaghetti',desc:'Creamy, saucy and cheesy. Green Arabian or Cheesy Arabian.',alias:['spaghetti']},
 {id:'x-dynamite',cat:'special',name:'Dynamite Chicken',price:600,img:'cv-x-dynamite',tag:'Spicy',desc:'Crispy chicken tossed in cheesy, saucy dynamite sauce.',alias:['dynamite']},
 {id:'f-broast',cat:'special',name:'Crispy Broast',price:500,sizes:[['Leg',500],['Chest',550]],img:'cv-f-broast',desc:'Quarter spicy broast: saucy, yummy and crispy.',alias:['broast']},

 /* ---------- fresh juices ---------- */
 {id:'j-orange',cat:'juice',name:'Orange Juice',price:300,img:'cv-j-orange',desc:'Freshly squeezed oranges.',alias:['orange','orange juice']},
 {id:'j-musambi',cat:'juice',name:'Musambi Juice',price:300,img:'cv-j-musambi',desc:'Sweet lime, pressed fresh.',alias:['musambi','mosambi']},
 {id:'j-grapefruit',cat:'juice',name:'Grape Fruit Juice',price:250,img:'cv-j-grapefruit',desc:'Tangy, refreshing grapefruit.',alias:['grape fruit','grapefruit']},
 {id:'j-annar',cat:'juice',name:'Annar Juice',price:500,img:'cv-j-annar',desc:'Fresh pomegranate juice.',alias:['annar','anar','pomegranate']},
 {id:'j-tarbooz',cat:'juice',name:'Tarbooz Juice',price:250,img:'cv-j-tarbooz',desc:'Chilled watermelon juice.',alias:['tarbooz','watermelon']},
 {id:'j-pineapple',cat:'juice',name:'Pineapple Juice',price:300,img:'cv-j-pineapple',desc:'Bright, sweet pineapple.',alias:['pineapple juice']},
 {id:'j-pinacolada',cat:'juice',name:'Pinacolada Juice',price:350,img:'cv-j-pinacolada',desc:'Pineapple and coconut, blended.',alias:['pinacolada juice']},
 {id:'j-apple',cat:'juice',name:'Apple Juice',price:300,img:'cv-j-apple',desc:'Fresh apple juice.',alias:['apple juice','apple']},
 {id:'j-falsa',cat:'juice',name:'Falsa Juice',price:250,img:'cv-j-falsa',desc:'Sweet-tart falsa berries.',alias:['falsa']},
 {id:'j-strawberry',cat:'juice',name:'Strawberry Juice',price:250,img:'cv-j-strawberry',desc:'Fresh strawberries, blended.',alias:['strawberry juice']},
 {id:'j-lemonmint',cat:'juice',name:'Lemon Mint',price:200,img:'cv-j-lemonmint',desc:'Lemon and fresh mint, ice-cold.',alias:['lemon mint','lemonmint','mint margarita']},
 {id:'j-margarita',cat:'juice',name:'Lemon Mint Margarita',price:350,img:'cv-j-margarita',desc:'Our lemon mint, made sparkling.',alias:['lemonmint margreeta','margreeta','margarita']},
 {id:'j-cocktail',cat:'juice',name:'Fruit Cocktail',price:300,img:'cv-j-cocktail',desc:'A mix of seasonal fruit juices.',alias:['cocktail','fruit cocktail']},
 {id:'j-carrot',cat:'juice',name:'Carrot Juice',price:200,img:'cv-j-carrot',desc:'Fresh carrot juice.',alias:['carrot']},
 {id:'j-abc',cat:'juice',name:'ABC Juice',price:300,img:'cv-j-abc',desc:'Apple, beetroot and carrot.',alias:['abc']},
 {id:'j-peach',cat:'juice',name:'Peach Juice',price:300,img:'cv-j-peach',desc:'Sweet peach juice.',alias:['peach juice']},

 /* ---------- shakes ---------- */
 {id:'m-banana',cat:'shake',name:'Banana Shake',price:200,img:'cv-m-banana',desc:'Creamy banana milkshake.',alias:['banana shake','banana']},
 {id:'m-mango',cat:'shake',name:'Mango Shake',price:300,img:'cv-m-mango',desc:'Thick mango milkshake.',alias:['mango shake']},
 {id:'m-strawberry',cat:'shake',name:'Strawberry Shake',price:300,img:'cv-m-strawberry',desc:'Strawberry milkshake.',alias:['strawberry shake']},
 {id:'m-pineapple',cat:'shake',name:'Pineapple Shake',price:300,img:'cv-m-pineapple',desc:'Pineapple milkshake.',alias:['pineapple shake']},
 {id:'m-chikko',cat:'shake',name:'Chikko Shake',price:250,img:'cv-m-chikko',desc:'Sapodilla milkshake.',alias:['chikko','chiku']},
 {id:'m-injeer',cat:'shake',name:'Injeer Shake',price:300,img:'cv-m-injeer',desc:'Fig milkshake.',alias:['injeer','anjeer','fig']},
 {id:'m-injeerkhajoor',cat:'shake',name:'Injeer Khajoor Shake',price:300,img:'cv-m-injeerkhajoor',desc:'Fig and date milkshake.',alias:['injeer khajoor','khajoor']},
 {id:'m-choccocktail',cat:'shake',name:'Chocolate Cocktail Shake',price:300,img:'cv-m-choccocktail',desc:'Chocolate and fruit, blended thick.',alias:['chocolate cocktail','choclate cocktail']},
 {id:'m-pinacolada',cat:'shake',name:'Pinacolada Shake',price:450,img:'cv-m-pinacolada',desc:'Pineapple and coconut milkshake.',alias:['pinacolada shake']},
 {id:'m-oreo',cat:'shake',name:'Oreo Chocolate Shake',price:400,img:'cv-m-oreo',desc:'Oreo cookies and chocolate.',alias:['oreo shake','oreo chocolate']},
 {id:'m-protein',cat:'shake',name:'Protein Shake',price:450,img:'cv-m-protein',desc:'A filling protein milkshake.',alias:['protein']},
 {id:'m-pista',cat:'shake',name:'Pista Shake',price:380,img:'cv-m-pista',desc:'Pistachio milkshake.',alias:['pista shake']},
 {id:'m-badam',cat:'shake',name:'Badam Shake',price:380,img:'cv-m-badam',desc:'Almond milkshake.',alias:['badam','almond']},
 {id:'m-special',cat:'shake',name:'Special Shake',price:450,img:'cv-m-special',desc:'The Foodies Mania special.',alias:['special shake']},
 {id:'m-peach',cat:'shake',name:'Peach Shake',price:300,img:'cv-m-peach',desc:'Peach milkshake.',alias:['peach shake']},
 {id:'ic-mango',cat:'shake',name:'Mango Ice-cream Shake',price:300,img:'cv-ic-mango',desc:'Mango shake blended with ice cream.',alias:['mango ice cream shake']},
 {id:'ic-strawberry',cat:'shake',name:'Strawberry Ice-cream Shake',price:300,img:'cv-ic-strawberry',desc:'Strawberry shake blended with ice cream.',alias:['strawberry ice cream shake']},
 {id:'ic-vanilla',cat:'shake',name:'Vanilla Ice-cream Shake',price:300,img:'cv-ic-vanilla',desc:'Vanilla shake blended with ice cream.',alias:['vanilla shake','vanilla ice cream shake']},
 {id:'ic-pineapple',cat:'shake',name:'Pineapple Ice-cream Shake',price:300,img:'cv-ic-pineapple',desc:'Pineapple shake blended with ice cream.',alias:['pineapple ice cream shake']},
 {id:'ic-blueberry',cat:'shake',name:'Blueberry Ice-cream Shake',price:300,img:'cv-ic-blueberry',desc:'Blueberry shake blended with ice cream.',alias:['blueberry']},

 /* ---------- ice cream, faluda, cold coffee ---------- */
 {id:'i-pista',cat:'dessert',name:'Pista Ice Cream',price:120,sizes:SCOOP,img:'cv-i-pista',desc:'Pistachio ice cream.',alias:['pista ice cream']},
 {id:'i-tutty',cat:'dessert',name:'Tutty Fruity Ice Cream',price:120,sizes:SCOOP,img:'cv-i-tutty',desc:'Fruity, colourful and classic.',alias:['tutty fruity','tutti frutti']},
 {id:'i-choc',cat:'dessert',name:'Chocolate Ice Cream',price:120,sizes:SCOOP,img:'cv-i-choc',desc:'Rich chocolate ice cream.',alias:['chocolate ice cream']},
 {id:'i-vanilla',cat:'dessert',name:'Vanilla Ice Cream',price:120,sizes:SCOOP,img:'cv-i-vanilla',desc:'Creamy vanilla ice cream.',alias:['vanilla ice cream']},
 {id:'i-oreo',cat:'dessert',name:'Oreo Ice Cream',price:120,sizes:SCOOP,img:'cv-i-oreo',desc:'Cookies-and-cream ice cream.',alias:['oreo ice cream']},
 {id:'i-falsp',cat:'dessert',name:'Special Faluda',price:400,img:'cv-i-falsp',desc:'Loaded faluda with ice cream, nuts and rose syrup.',alias:['special faluda','faluda','falooda']},
 {id:'i-falsada',cat:'dessert',name:'Sada Faluda',price:300,img:'cv-i-falsada',desc:'Classic faluda.',alias:['sada faluda','simple faluda']},
 {id:'i-coffee',cat:'dessert',name:'Cold Coffee',price:350,img:'cv-i-coffee',desc:'Chilled, creamy cold coffee.',alias:['cold coffee','iced coffee','coffee']},

 /* ---------- drinks & add-ons ---------- */
 {id:'k-cold',cat:'addon',name:'Cold Drink',price:80,sizes:[['345ml',80],['500ml',110],['1 Ltr',160],['1.5 Ltr',210]],img:'cv-k-cold',desc:'Chilled. Choose white or black in the note.',alias:['drink','cold drink','coke','pepsi','sprite','7up','soft drink','cola','next','fizup']},
 {id:'k-water',cat:'addon',name:'Water',price:70,sizes:[['Small',70],['Large',130]],img:'cv-k-water',desc:'Chilled mineral water.',alias:['water','pani']},
 {id:'q-paratha',cat:'addon',crm:'bbq',name:'Paratha',price:60,sizes:[['Small',60],['Large',100]],img:'cv-q-paratha',desc:'Flaky, buttery paratha off the tawa.',alias:['paratha','parata']},
 {id:'a-cheese',cat:'addon',crm:'pizza',name:'Extra Cheese Topping',price:50,sizes:TOP,img:'cv-a-cheese',desc:'Extra cheese on any pizza. Pick the size of your pizza.',alias:['extra cheese','cheese topping','cheese top']},
 {id:'a-meat',cat:'addon',crm:'pizza',name:'Extra Meat Topping',price:50,sizes:TOP,img:'cv-a-meat',desc:'Extra meat on any pizza. Pick the size of your pizza.',alias:['extra meat','meat topping','meat top']}
];

/* delivery areas and fees, identical to the CRM's list so the bill matches */
const FM_AREAS=[
 ['F.B. Area',150],['Azizabad',150],['Karimabad',160],['Gulberg',160],['Hussainabad',160],['Liaquatabad',170],['F.C. Area',170],
 ['Nazimabad',180],['North Nazimabad',180],['Gulshan-e-Iqbal',190],['Shadman Town',180],['Bahadurabad',200],['P.E.C.H.S',210],
 ['North Karachi',200],['New Karachi',210],['Gulistan-e-Johar',220],['Scheme 33',220],['Tariq Road',210],['Saddar',220],
 ['Shah Faisal Colony',230],['Clifton',230],['DHA',230]].map(a=>({name:a[0],fee:a[1]}));

/* the same four ways to pay as the CRM. Account details are DEMO placeholders. */
const FM_PAY=[
 {id:'COD',name:'Cash on Delivery',short:'Cash',note:'Pay the rider in cash.'},
 {id:'EasyPaisa',name:'EasyPaisa',short:'EasyPaisa',acct:'0335-2115129',title:'Foodies Mania (demo)'},
 {id:'JazzCash',name:'JazzCash',short:'JazzCash',acct:'0300-0000000',title:'Foodies Mania (demo)'},
 {id:'Bank',name:'Bank Transfer',short:'Bank',acct:'PK00 DEMO 0000 0000 0000 0000',title:'Foodies Mania · Demo Bank'}
];

const FM_BYID={};FM_ITEMS.forEach(i=>FM_BYID[i.id]=i);
const fmImg=(id,size='')=>`assets/food/${id}${size}.webp`;
const fmRs=n=>'Rs '+Math.round(n).toLocaleString('en-US');
