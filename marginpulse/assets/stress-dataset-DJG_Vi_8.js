const S=`sku,title,marketplace,channel,category,cost,price,referral_fee_pct,fba_fee,units_per_day,return_rate_pct,inventory,buybox,repricer,ad_spend_total,shipping_total,refunds_total,payment_fees_total\r
STRESS-0001,"Home & Kitchen Product 1",FR,Amazon,Home & Kitchen,13.56,36.45,14,3.28,10,2.1,251,FALSE,TRUE,874.8,450,229.64,293.7\r
STRESS-0002,"Sports & Outdoors Product 2",IT,WooCommerce,Sports & Outdoors,56.07,99.54,13,4.75,22,5,90,FALSE,TRUE,5255.71,990,3284.82,1478.93\r
STRESS-0003,"Beauty & Health Product 3",ES,Shopify,Beauty & Health,53.57,93.59,14,3.13,14,3.3,474,TRUE,FALSE,3144.62,630,1297.16,891.16\r
STRESS-0004,"Apparel Product 4",DE,Amazon,Apparel,39.91,85.5,12,2.58,14,6.1,430,TRUE,FALSE,2872.8,630,2190.51,823.2\r
STRESS-0005,"Pet Supplies Product 5",FR,WooCommerce,Pet Supplies,33.95,64.78,14,5.02,25,4.2,94,TRUE,TRUE,3886.8,1125,2040.57,1159.2\r
STRESS-0006,"Electronics Product 6",IT,Shopify,Electronics,13.99,25.8,14,5.32,10,3.1,172,FALSE,FALSE,619.2,450,239.94,229.8\r
STRESS-0007,"Home & Kitchen Product 7",ES,Amazon,Home & Kitchen,24.76,43.39,15,3.17,22,4.9,201,TRUE,FALSE,2290.99,990,1403.23,737.75\r
STRESS-0008,"Sports & Outdoors Product 8",DE,WooCommerce,Sports & Outdoors,36.94,98.3,15,44.23,11,5.6,187,FALSE,TRUE,2595.12,495,1816.58,731.28\r
STRESS-0009,"Beauty & Health Product 9",FR,Shopify,Beauty & Health,10.26,24.98,14,4.94,13,3,152,TRUE,TRUE,779.38,585,292.27,292.34\r
STRESS-0010,"Apparel Product 10",IT,Amazon,Apparel,44.27,84.44,15,3.91,4,2.6,292,TRUE,TRUE,810.62,180,263.45,232.66\r
STRESS-0011,"Pet Supplies Product 11",ES,WooCommerce,Pet Supplies,27.49,51.21,13,2.66,2,6.1,490,TRUE,FALSE,245.81,90,187.43,76.45\r
STRESS-0012,"Electronics Product 12",DE,Shopify,Electronics,20.14,47.86,13,5.44,23,3,192,TRUE,FALSE,2641.87,1035,990.7,832.97\r
STRESS-0013,"Home & Kitchen Product 13",FR,Amazon,Home & Kitchen,17.42,49.33,14,3.78,12,3.3,317,TRUE,TRUE,1420.7,540,586.04,445.18\r
STRESS-0014,"Sports & Outdoors Product 14",IT,WooCommerce,Sports & Outdoors,27.05,66.3,13,3.96,24,3.2,464,TRUE,TRUE,3818.88,1080,1527.55,1134.72\r
STRESS-0015,"Beauty & Health Product 15",ES,Shopify,Beauty & Health,33.36,93.61,13,4.39,13,6.8,490,TRUE,TRUE,2920.63,585,2482.54,827.66\r
STRESS-0016,"Apparel Product 16",DE,Amazon,Apparel,44.55,41.25,14,2.67,9,4.3,394,TRUE,FALSE,891,405,478.91,290.25\r
STRESS-0017,"Pet Supplies Product 17",FR,WooCommerce,Pet Supplies,27.22,63.93,14,4.84,12,3.3,374,TRUE,FALSE,1841.18,540,759.49,550.3\r
STRESS-0018,"Electronics Product 18",IT,Shopify,Electronics,46.24,86.78,15,5.09,14,7,492,TRUE,TRUE,2915.81,630,2551.33,833.95\r
STRESS-0019,"Home & Kitchen Product 19",ES,Amazon,Home & Kitchen,9.54,19.64,14,3.37,19,2.1,473,TRUE,FALSE,895.58,855,235.09,366.4\r
STRESS-0020,"Sports & Outdoors Product 20",DE,WooCommerce,Sports & Outdoors,31.48,63.9,12,3.93,15,2.3,113,FALSE,FALSE,2300.4,675,661.37,687.6\r
STRESS-0021,"Beauty & Health Product 21",FR,Shopify,Beauty & Health,19.12,39.01,13,5.91,17,5,212,TRUE,FALSE,1591.61,765,994.75,525.4\r
STRESS-0022,"Apparel Product 22",IT,Amazon,Apparel,52.96,92.82,14,4.79,19,4.9,174,FALSE,FALSE,4232.59,855,2592.46,1200.65\r
STRESS-0023,"Pet Supplies Product 23",ES,WooCommerce,Pet Supplies,10.36,23.78,13,5.22,17,6.1,181,TRUE,TRUE,970.22,765,739.8,370.06\r
STRESS-0024,"Electronics Product 24",DE,Shopify,Electronics,24.03,45.11,14,5.14,18,22.5,411,TRUE,TRUE,1948.75,810,6089.85,622.19\r
STRESS-0025,"Home & Kitchen Product 25",FR,Amazon,Home & Kitchen,35.1,89.88,14,4.31,18,2,246,FALSE,TRUE,3882.82,810,970.7,1105.7\r
STRESS-0026,"Sports & Outdoors Product 26",IT,WooCommerce,Sports & Outdoors,15.34,34.34,15,4.85,16,2.6,274,TRUE,TRUE,1318.66,720,428.56,449.66\r
STRESS-0027,"Beauty & Health Product 27",ES,Shopify,Beauty & Health,10.61,27.31,15,5.89,20,2.6,150,TRUE,TRUE,1310.88,900,426.04,477.72\r
STRESS-0028,"Apparel Product 28",DE,Amazon,Apparel,50.38,89.26,12,4.88,24,5.1,309,TRUE,TRUE,5141.38,1080,3277.63,1465.34\r
STRESS-0029,"Pet Supplies Product 29",FR,WooCommerce,Pet Supplies,36.6,79.34,15,3.33,13,5,158,TRUE,TRUE,2475.41,585,1547.13,716.35\r
STRESS-0030,"Electronics Product 30",IT,Shopify,Electronics,14.7,26.81,14,3.29,6,2.5,416,TRUE,FALSE,386.06,270,120.65,141.52\r
STRESS-0031,"Home & Kitchen Product 31",ES,Amazon,Home & Kitchen,19.76,51.88,12,5.44,7,4.2,316,TRUE,TRUE,871.58,315,457.58,270.4\r
STRESS-0032,"Sports & Outdoors Product 32",DE,WooCommerce,Sports & Outdoors,16.37,40.13,15,5.17,2,6.3,132,TRUE,FALSE,1565.07,90,151.69,63.16\r
STRESS-0033,"Beauty & Health Product 33",FR,Shopify,Beauty & Health,51.42,93.3,13,2.67,20,4.2,452,FALSE,TRUE,4478.4,900,2351.16,1269.6\r
STRESS-0034,"Apparel Product 34",IT,Amazon,Apparel,12.16,22.78,13,3.41,22,5.5,77,TRUE,FALSE,1202.78,990,826.91,465.7\r
STRESS-0035,"Pet Supplies Product 35",ES,WooCommerce,Pet Supplies,18.84,35.26,12,3.86,25,5.8,249,TRUE,TRUE,2115.6,1125,1533.81,716.4\r
STRESS-0036,"Electronics Product 36",DE,Shopify,Electronics,11.57,31.67,14,4.81,25,3.2,222,TRUE,TRUE,1900.2,1125,760.08,662.55\r
STRESS-0037,"Home & Kitchen Product 37",FR,Amazon,Home & Kitchen,22.17,38.07,15,4.82,17,7,205,TRUE,TRUE,1553.26,765,1359.1,515.81\r
STRESS-0038,"Sports & Outdoors Product 38",IT,WooCommerce,Sports & Outdoors,22.95,61.62,12,4.98,22,5.2,396,TRUE,TRUE,3253.54,990,2114.8,978.38\r
STRESS-0039,"Beauty & Health Product 39",ES,Shopify,Beauty & Health,9.96,25.8,13,4.29,7,3.1,68,FALSE,TRUE,433.44,315,167.96,160.86\r
STRESS-0040,"Apparel Product 40",DE,Amazon,Apparel,21.15,45.2,13,20.34,10,4.7,443,TRUE,TRUE,1084.8,450,637.32,346.2\r
STRESS-0041,"Pet Supplies Product 41",FR,WooCommerce,Pet Supplies,13.65,28.46,12,4.16,7,7,236,TRUE,TRUE,478.13,315,418.36,172.03\r
STRESS-0042,"Electronics Product 42",IT,Shopify,Electronics,34.91,62.76,13,3.87,23,4.9,151,TRUE,FALSE,3464.35,1035,2121.92,1038.59\r
STRESS-0043,"Home & Kitchen Product 43",ES,Amazon,Home & Kitchen,42.72,97.99,12,4.97,20,7,300,TRUE,FALSE,4703.52,900,4115.58,1325.88\r
STRESS-0044,"Sports & Outdoors Product 44",DE,WooCommerce,Sports & Outdoors,37.77,83.82,13,5.61,22,5.4,182,TRUE,FALSE,4425.7,990,2987.34,1271.42\r
STRESS-0045,"Beauty & Health Product 45",FR,Shopify,Beauty & Health,10.05,27.72,14,3.19,20,4.4,341,TRUE,FALSE,1330.56,900,731.81,482.64\r
STRESS-0046,"Apparel Product 46",IT,Amazon,Apparel,9.37,19.15,14,5.5,9,3.9,496,TRUE,TRUE,413.64,405,201.65,170.91\r
STRESS-0047,"Pet Supplies Product 47",ES,WooCommerce,Pet Supplies,19.23,33.06,13,3.61,8,6.4,403,TRUE,TRUE,634.75,360,507.8,218.69\r
STRESS-0048,"Electronics Product 48",DE,Shopify,Electronics,17.08,46.51,12,5.58,14,22.5,456,TRUE,TRUE,1562.74,630,4883.55,495.68\r
STRESS-0049,"Home & Kitchen Product 49",FR,Amazon,Home & Kitchen,11.85,26.03,13,3.17,23,3.5,498,TRUE,TRUE,1436.86,1035,628.62,531.71\r
STRESS-0050,"Sports & Outdoors Product 50",IT,WooCommerce,Sports & Outdoors,8.69,23.72,15,2.95,23,5.6,340,TRUE,FALSE,1309.34,1035,916.54,499.84\r
STRESS-0051,"Beauty & Health Product 51",ES,Shopify,Beauty & Health,8.5,19.65,15,4.01,5,2.4,300,TRUE,FALSE,235.8,225,70.74,96.45\r
STRESS-0052,"Apparel Product 52",DE,Amazon,Apparel,11.49,20.27,12,5.92,18,6.4,398,TRUE,TRUE,875.66,810,700.53,353.92\r
STRESS-0053,"Pet Supplies Product 53",FR,WooCommerce,Pet Supplies,12.65,25.87,14,4.91,12,3,325,TRUE,TRUE,745.06,540,279.4,276.26\r
STRESS-0054,"Electronics Product 54",IT,Shopify,Electronics,39.87,93.14,12,4.18,22,6.4,328,TRUE,FALSE,4917.79,990,3934.23,1394.45\r
STRESS-0055,"Home & Kitchen Product 55",ES,Amazon,Home & Kitchen,44.7,80.91,15,5.13,9,4.3,364,TRUE,FALSE,1747.66,405,939.37,504.41\r
STRESS-0056,"Sports & Outdoors Product 56",DE,WooCommerce,Sports & Outdoors,17.05,30.2,13,13.59,10,3.7,297,TRUE,FALSE,724.8,450,335.22,256.2\r
STRESS-0057,"Beauty & Health Product 57",FR,Shopify,Beauty & Health,24.84,58.64,14,3.88,13,2.7,150,TRUE,TRUE,1829.57,585,617.48,554.89\r
STRESS-0058,"Apparel Product 58",IT,Amazon,Apparel,15.2,29.1,15,4.64,11,5,230,TRUE,TRUE,768.24,495,480.15,274.56\r
STRESS-0059,"Pet Supplies Product 59",ES,WooCommerce,Pet Supplies,17.62,35.55,15,2.53,17,2.6,377,FALSE,TRUE,1450.44,765,471.39,490.11\r
STRESS-0060,"Electronics Product 60",DE,Shopify,Electronics,38.46,93.42,15,3.33,23,3.1,108,TRUE,TRUE,5156.78,1035,1998.25,1461.7\r
STRESS-0061,"Home & Kitchen Product 61",FR,Amazon,Home & Kitchen,20.61,53.33,15,2.95,9,5.7,460,TRUE,FALSE,1151.93,405,820.75,355.48\r
STRESS-0062,"Sports & Outdoors Product 62",IT,WooCommerce,Sports & Outdoors,43.35,88.93,14,5.61,25,4.1,293,FALSE,TRUE,5335.8,1125,2734.6,1521.45\r
STRESS-0063,"Beauty & Health Product 63",ES,Shopify,Beauty & Health,20.55,36.76,12,5.23,19,2.5,339,TRUE,TRUE,1676.26,855,523.83,561.56\r
STRESS-0064,"Apparel Product 64",DE,Amazon,Apparel,39.07,84.18,14,4.41,6,6.6,424,TRUE,TRUE,9849.06,270,1000.06,348.05\r
STRESS-0065,"Pet Supplies Product 65",FR,WooCommerce,Pet Supplies,42.28,79.11,14,4.22,10,5.9,168,TRUE,TRUE,1898.64,450,1400.25,549.66\r
STRESS-0066,"Electronics Product 66",IT,Shopify,Electronics,11.76,28.24,14,4.36,14,6.2,104,TRUE,FALSE,948.86,630,735.37,342.22\r
STRESS-0067,"Home & Kitchen Product 67",ES,Amazon,Home & Kitchen,26.55,53.96,14,5.08,13,4.6,252,TRUE,TRUE,1683.55,585,968.04,518.39\r
STRESS-0068,"Sports & Outdoors Product 68",DE,WooCommerce,Sports & Outdoors,23.25,43.61,13,3.7,15,4.1,450,TRUE,TRUE,1569.96,675,804.6,504.99\r
STRESS-0069,"Beauty & Health Product 69",FR,Shopify,Beauty & Health,21.46,60.05,12,5.08,7,3.4,135,TRUE,FALSE,1008.84,315,428.76,304.71\r
STRESS-0070,"Apparel Product 70",IT,Amazon,Apparel,21.59,49.91,12,5.6,13,3.5,367,TRUE,TRUE,1557.19,585,681.27,486.8\r
STRESS-0071,"Pet Supplies Product 71",ES,WooCommerce,Pet Supplies,38.78,83.84,15,4.95,25,5.2,198,TRUE,FALSE,5030.4,1125,3269.76,1445.1\r
STRESS-0072,"Electronics Product 72",DE,Shopify,Electronics,26.31,58.94,14,3.08,10,22.5,193,TRUE,TRUE,1414.56,450,4420.5,428.64\r
STRESS-0073,"Home & Kitchen Product 73",FR,Amazon,Home & Kitchen,18.55,36.55,14,3.65,6,4.8,459,TRUE,TRUE,526.32,270,315.79,176.58\r
STRESS-0074,"Sports & Outdoors Product 74",IT,WooCommerce,Sports & Outdoors,31.42,74.75,14,3.08,8,5.8,470,TRUE,TRUE,1435.2,360,1040.52,418.8\r
STRESS-0075,"Beauty & Health Product 75",ES,Shopify,Beauty & Health,36.78,93.19,15,2.64,21,3.4,311,TRUE,TRUE,4696.78,945,1996.13,1331.69\r
STRESS-0076,"Apparel Product 76",DE,Amazon,Apparel,17.74,48.18,12,2.76,10,6.9,289,TRUE,TRUE,1156.32,450,997.33,364.08\r
STRESS-0077,"Pet Supplies Product 77",FR,WooCommerce,Pet Supplies,15.84,28.91,12,5.45,18,2.8,449,TRUE,TRUE,1248.91,810,437.12,447.23\r
STRESS-0078,"Electronics Product 78",IT,Shopify,Electronics,27.87,60.39,13,3.68,24,3.4,146,TRUE,FALSE,3478.46,1080,1478.35,1049.62\r
STRESS-0079,"Home & Kitchen Product 79",ES,Amazon,Home & Kitchen,27.12,77.29,15,3.49,16,2.2,374,FALSE,TRUE,2967.94,720,816.18,861.98\r
STRESS-0080,"Sports & Outdoors Product 80",DE,WooCommerce,Sports & Outdoors,67.46,62.46,13,5.12,3,5.5,159,TRUE,FALSE,449.71,135,309.18,134.93\r
STRESS-0081,"Beauty & Health Product 81",FR,Shopify,Beauty & Health,14.6,25.33,12,3.32,20,6.2,364,TRUE,TRUE,1215.84,900,942.28,453.96\r
STRESS-0082,"Apparel Product 82",IT,Amazon,Apparel,19.94,36.49,12,5.91,11,2.6,156,TRUE,TRUE,963.34,495,313.08,323.33\r
STRESS-0083,"Pet Supplies Product 83",ES,WooCommerce,Pet Supplies,19.86,44.1,12,5.98,24,6.9,229,TRUE,FALSE,2540.16,1080,2190.89,815.04\r
STRESS-0084,"Electronics Product 84",DE,Shopify,Electronics,16.79,39.68,13,2.89,17,2.7,275,TRUE,TRUE,1618.94,765,546.39,532.24\r
STRESS-0085,"Home & Kitchen Product 85",FR,Amazon,Home & Kitchen,20.94,42.27,12,4.55,22,5.5,114,TRUE,FALSE,2231.86,990,1534.4,722.96\r
STRESS-0086,"Sports & Outdoors Product 86",IT,WooCommerce,Sports & Outdoors,32.81,75.14,15,3.55,3,6.9,157,TRUE,FALSE,541.01,135,466.62,157.75\r
STRESS-0087,"Beauty & Health Product 87",ES,Shopify,Beauty & Health,35.35,95.43,12,3.31,10,5.1,51,TRUE,FALSE,2290.32,450,1460.08,647.58\r
STRESS-0088,"Apparel Product 88",DE,Amazon,Apparel,43.92,89.12,12,40.1,4,2.4,472,TRUE,TRUE,855.55,180,256.67,243.89\r
STRESS-0089,"Pet Supplies Product 89",FR,WooCommerce,Pet Supplies,28.96,56.76,12,5.56,20,3.3,82,TRUE,TRUE,2724.48,900,1123.85,831.12\r
STRESS-0090,"Electronics Product 90",IT,Shopify,Electronics,36.22,97.11,12,5.12,8,5.7,163,FALSE,FALSE,1864.51,360,1328.46,526.13\r
STRESS-0091,"Home & Kitchen Product 91",ES,Amazon,Home & Kitchen,17.99,32.77,14,3.25,13,5.7,95,TRUE,TRUE,1022.42,585,728.48,353.11\r
STRESS-0092,"Sports & Outdoors Product 92",DE,WooCommerce,Sports & Outdoors,16.69,28.07,15,5.64,22,4.8,297,TRUE,TRUE,1482.1,990,889.26,535.52\r
STRESS-0093,"Beauty & Health Product 93",FR,Shopify,Beauty & Health,28.15,56.37,12,3.94,6,3.5,382,TRUE,TRUE,811.73,270,355.13,247.93\r
STRESS-0094,"Apparel Product 94",IT,Amazon,Apparel,11.57,30.43,15,4.98,1,4.1,388,TRUE,TRUE,73.03,45,37.43,25.76\r
STRESS-0095,"Pet Supplies Product 95",ES,WooCommerce,Pet Supplies,31.3,61.47,13,5.86,6,2.2,102,TRUE,FALSE,885.17,270,243.42,266.29\r
STRESS-0096,"Electronics Product 96",DE,Shopify,Electronics,26.44,57.76,15,5.6,23,2.4,312,TRUE,FALSE,25905.36,1035,956.51,969.59\r
STRESS-0097,"Home & Kitchen Product 97",FR,Amazon,Home & Kitchen,22.57,48.65,14,5.69,21,3.3,334,FALSE,FALSE,2451.96,945,1011.43,770.49\r
STRESS-0098,"Sports & Outdoors Product 98",IT,WooCommerce,Sports & Outdoors,45.85,94.16,14,3.71,15,4.3,243,TRUE,FALSE,3389.76,675,1822,959.94\r
STRESS-0099,"Beauty & Health Product 99",ES,Shopify,Beauty & Health,12.9,23.59,14,2.62,25,6.3,440,TRUE,FALSE,1415.4,1125,1114.63,541.35\r
STRESS-0100,"Apparel Product 100",DE,Amazon,Apparel,25.53,67.06,13,4.45,11,3.5,223,TRUE,TRUE,1770.38,495,774.54,525.1\r
STRESS-0101,"Pet Supplies Product 101",FR,WooCommerce,Pet Supplies,36.56,63.51,14,3.94,21,2,107,TRUE,FALSE,3200.9,945,800.23,957.73\r
STRESS-0102,"Electronics Product 102",IT,Shopify,Electronics,32.53,66.7,13,4.69,8,5.1,78,TRUE,FALSE,1280.64,360,816.41,380.16\r
STRESS-0103,"Home & Kitchen Product 103",ES,Amazon,Home & Kitchen,29.43,50.43,12,4.9,11,3.4,437,TRUE,TRUE,1331.35,495,565.82,415.34\r
STRESS-0104,"Sports & Outdoors Product 104",DE,WooCommerce,Sports & Outdoors,31.53,88.76,14,39.94,23,2.2,163,FALSE,TRUE,4899.55,1035,1347.38,1397.39\r
STRESS-0105,"Beauty & Health Product 105",FR,Shopify,Beauty & Health,13.29,32.67,14,4.2,7,2,237,TRUE,FALSE,548.86,315,137.21,189.71\r
STRESS-0106,"Apparel Product 106",IT,Amazon,Apparel,32.5,73.72,13,5.86,15,6.2,333,TRUE,TRUE,2653.92,675,2056.79,775.98\r
STRESS-0107,"Pet Supplies Product 107",ES,WooCommerce,Pet Supplies,12.27,22.63,12,5.97,25,4.2,271,TRUE,FALSE,1357.8,1125,712.85,526.95\r
STRESS-0108,"Electronics Product 108",DE,Shopify,Electronics,16.67,34.44,13,5.64,16,5.2,337,TRUE,TRUE,1322.5,720,859.62,450.62\r
STRESS-0109,"Home & Kitchen Product 109",FR,Amazon,Home & Kitchen,22.82,47.11,15,4.08,25,3.1,277,TRUE,TRUE,2826.6,1125,1095.31,894.15\r
STRESS-0110,"Sports & Outdoors Product 110",IT,WooCommerce,Sports & Outdoors,39.5,97.69,15,2.72,16,2.9,132,TRUE,TRUE,3751.3,720,1359.84,1057.82\r
STRESS-0111,"Beauty & Health Product 111",ES,Shopify,Beauty & Health,39.23,91.43,14,5.36,21,2.7,291,TRUE,TRUE,4608.07,945,1555.22,1309.52\r
STRESS-0112,"Apparel Product 112",DE,Amazon,Apparel,91.97,85.16,13,3.63,12,2.8,180,FALSE,FALSE,2452.61,540,858.41,703.15\r
STRESS-0113,"Pet Supplies Product 113",FR,WooCommerce,Pet Supplies,26.27,69.47,14,4.31,9,4.5,177,TRUE,FALSE,1500.55,405,844.06,442.64\r
STRESS-0114,"Electronics Product 114",IT,Shopify,Electronics,10.3,21.62,15,5.93,12,3.1,112,TRUE,TRUE,622.66,540,241.28,245.66\r
STRESS-0115,"Home & Kitchen Product 115",ES,Amazon,Home & Kitchen,11.08,31.32,14,4.78,22,4.7,304,TRUE,TRUE,1653.7,990,971.55,578.42\r
STRESS-0116,"Sports & Outdoors Product 116",DE,WooCommerce,Sports & Outdoors,42.3,76.53,14,4.04,6,3,109,FALSE,TRUE,1102.03,270,413.26,320.51\r
STRESS-0117,"Beauty & Health Product 117",FR,Shopify,Beauty & Health,40.89,69.44,14,2.89,15,6,481,FALSE,TRUE,2499.84,675,1874.88,737.46\r
STRESS-0118,"Apparel Product 118",IT,Amazon,Apparel,44.85,86.27,15,3.73,20,2.3,488,TRUE,FALSE,4140.96,900,1190.53,1185.24\r
STRESS-0119,"Pet Supplies Product 119",ES,WooCommerce,Pet Supplies,32.69,60.3,12,4.9,5,6.3,131,TRUE,TRUE,723.6,225,569.84,218.4\r
STRESS-0120,"Electronics Product 120",DE,Shopify,Electronics,29.7,62.88,14,4.12,19,22.5,496,TRUE,TRUE,2867.33,855,8960.4,859.33\r
STRESS-0121,"Home & Kitchen Product 121",FR,Amazon,Home & Kitchen,23.9,41.75,13,5.26,8,2.6,194,TRUE,FALSE,801.6,360,260.52,260.4\r
STRESS-0122,"Sports & Outdoors Product 122",IT,WooCommerce,Sports & Outdoors,23.71,46.25,15,3.85,11,4.9,271,TRUE,TRUE,1221,495,747.86,387.75\r
STRESS-0123,"Beauty & Health Product 123",ES,Shopify,Beauty & Health,40.99,90.43,15,4.95,7,4.2,153,TRUE,TRUE,1519.22,315,797.59,432.31\r
STRESS-0124,"Apparel Product 124",DE,Amazon,Apparel,9.4,16.62,12,4.4,23,6.4,265,TRUE,TRUE,917.42,1035,733.94,401.86\r
STRESS-0125,"Pet Supplies Product 125",FR,WooCommerce,Pet Supplies,36.44,67.36,13,4.11,24,4.3,349,FALSE,TRUE,3879.94,1080,2085.47,1149.98\r
STRESS-0126,"Electronics Product 126",IT,Shopify,Electronics,48.27,91.65,14,2.8,20,3.7,115,TRUE,TRUE,4399.2,900,2034.63,1249.8\r
STRESS-0127,"Home & Kitchen Product 127",ES,Amazon,Home & Kitchen,37.35,87.43,12,4.44,7,3.7,204,TRUE,FALSE,1468.82,315,679.33,419.71\r
STRESS-0128,"Sports & Outdoors Product 128",DE,WooCommerce,Sports & Outdoors,15.85,39.96,15,5.86,3,2.3,320,TRUE,TRUE,2337.66,135,82.72,94.43\r
STRESS-0129,"Beauty & Health Product 129",FR,Shopify,Beauty & Health,45.08,89.94,13,5.58,12,4.1,200,FALSE,FALSE,2590.27,540,1327.51,737.57\r
STRESS-0130,"Apparel Product 130",IT,Amazon,Apparel,31.28,77.9,15,5.03,13,5.6,97,TRUE,TRUE,2430.48,585,1701.34,705.12\r
STRESS-0131,"Pet Supplies Product 131",ES,WooCommerce,Pet Supplies,26.13,74.41,14,3.93,15,4.7,274,TRUE,TRUE,2678.76,675,1573.77,782.19\r
STRESS-0132,"Electronics Product 132",DE,Shopify,Electronics,7.98,22.57,15,4.48,13,2.9,485,TRUE,FALSE,704.18,585,255.27,273.55\r
STRESS-0133,"Home & Kitchen Product 133",FR,Amazon,Home & Kitchen,19.47,35.67,14,4.63,9,4.2,126,FALSE,FALSE,770.47,405,404.5,260.12\r
STRESS-0134,"Sports & Outdoors Product 134",IT,WooCommerce,Sports & Outdoors,43.72,88.35,12,4.66,8,6.9,63,TRUE,TRUE,1696.32,360,1463.08,484.08\r
STRESS-0135,"Beauty & Health Product 135",ES,Shopify,Beauty & Health,14.27,36.05,13,5.87,14,3.4,245,TRUE,TRUE,1211.28,630,514.79,407.82\r
STRESS-0136,"Apparel Product 136",DE,Amazon,Apparel,46.84,79.94,13,35.97,18,5.9,323,TRUE,FALSE,3453.41,810,2546.89,998.35\r
STRESS-0137,"Pet Supplies Product 137",FR,WooCommerce,Pet Supplies,36.78,75.91,15,5.59,11,3.3,230,TRUE,FALSE,2004.02,495,826.66,583.51\r
STRESS-0138,"Electronics Product 138",IT,Shopify,Electronics,8.76,19.63,12,4.75,7,3.3,377,TRUE,TRUE,329.78,315,136.04,134.95\r
STRESS-0139,"Home & Kitchen Product 139",ES,Amazon,Home & Kitchen,37.32,85.95,15,3.7,19,2.7,106,TRUE,TRUE,3919.32,855,1322.77,1122.33\r
STRESS-0140,"Sports & Outdoors Product 140",DE,WooCommerce,Sports & Outdoors,35.43,68.41,13,2.92,4,2.6,405,TRUE,TRUE,656.74,180,213.44,194.18\r
STRESS-0141,"Beauty & Health Product 141",FR,Shopify,Beauty & Health,40.17,88.46,13,2.9,23,5.2,366,TRUE,TRUE,4882.99,1035,3173.94,1393.25\r
STRESS-0142,"Apparel Product 142",IT,Amazon,Apparel,30.83,66.61,14,2.96,20,5.9,137,TRUE,TRUE,3197.28,900,2357.99,949.32\r
STRESS-0143,"Pet Supplies Product 143",ES,WooCommerce,Pet Supplies,51.61,90.68,14,3.83,10,2.1,334,TRUE,TRUE,2176.32,450,571.28,619.08\r
STRESS-0144,"Electronics Product 144",DE,Shopify,Electronics,38.18,64.21,12,5.27,19,22.5,218,FALSE,TRUE,2927.98,855,9149.92,874.49\r
STRESS-0145,"Home & Kitchen Product 145",FR,Amazon,Home & Kitchen,13.76,29.31,12,5.86,13,3,263,TRUE,FALSE,914.47,585,342.93,326.12\r
STRESS-0146,"Sports & Outdoors Product 146",IT,WooCommerce,Sports & Outdoors,41.6,94.8,15,5.97,5,6.3,362,FALSE,TRUE,1137.6,225,895.86,321.9\r
STRESS-0147,"Beauty & Health Product 147",ES,Shopify,Beauty & Health,46.18,90.98,14,4.08,25,6.9,71,FALSE,FALSE,5458.8,1125,4708.22,1552.2\r
STRESS-0148,"Apparel Product 148",DE,Amazon,Apparel,28.88,59.98,14,3.73,4,6,299,TRUE,TRUE,575.81,180,431.86,173.95\r
STRESS-0149,"Pet Supplies Product 149",FR,WooCommerce,Pet Supplies,25.09,58.1,14,3.08,8,6.3,310,TRUE,TRUE,1115.52,360,878.47,338.88\r
STRESS-0150,"Electronics Product 150",IT,Shopify,Electronics,40.36,74.37,15,3.44,7,3.5,437,TRUE,TRUE,1249.42,315,546.62,364.85\r
STRESS-0151,"Home & Kitchen Product 151",ES,Amazon,Home & Kitchen,44.35,76.04,14,3.04,18,4.1,209,TRUE,FALSE,3284.93,810,1683.53,956.23\r
STRESS-0152,"Sports & Outdoors Product 152",DE,WooCommerce,Sports & Outdoors,22.02,43.5,13,19.57,8,3.5,78,TRUE,TRUE,835.2,360,365.4,268.8\r
STRESS-0153,"Beauty & Health Product 153",FR,Shopify,Beauty & Health,19.99,46.81,13,4.85,24,3.5,80,TRUE,TRUE,2696.26,1080,1179.61,854.06\r
STRESS-0154,"Apparel Product 154",IT,Amazon,Apparel,14.27,31.06,15,4.12,7,4.3,53,TRUE,FALSE,521.81,315,280.47,182.95\r
STRESS-0155,"Pet Supplies Product 155",ES,WooCommerce,Pet Supplies,37.12,68.86,14,3.93,15,5.2,225,TRUE,TRUE,2478.96,675,1611.32,732.24\r
STRESS-0156,"Electronics Product 156",DE,Shopify,Electronics,12.99,29.72,13,3.6,14,3.8,111,FALSE,TRUE,998.59,630,474.33,354.65\r
STRESS-0157,"Home & Kitchen Product 157",FR,Amazon,Home & Kitchen,35.47,77.19,13,4.59,17,4.4,345,TRUE,TRUE,3149.35,765,1732.14,914.84\r
STRESS-0158,"Sports & Outdoors Product 158",IT,WooCommerce,Sports & Outdoors,16.73,30.84,14,3.58,4,6.6,104,TRUE,TRUE,296.06,180,244.25,104.02\r
STRESS-0159,"Beauty & Health Product 159",ES,Shopify,Beauty & Health,27.96,56.14,14,5.34,16,3,179,TRUE,FALSE,2155.78,720,808.42,658.94\r
STRESS-0160,"Apparel Product 160",DE,Amazon,Apparel,32.4,63.35,13,4.12,11,6.1,448,TRUE,TRUE,13588.58,495,1275.24,500.61\r
STRESS-0161,"Pet Supplies Product 161",FR,WooCommerce,Pet Supplies,39.93,69.18,15,3.09,7,2.5,490,TRUE,TRUE,1162.22,315,363.2,343.06\r
STRESS-0162,"Electronics Product 162",IT,Shopify,Electronics,24.87,55.96,13,5.42,17,5,144,FALSE,FALSE,2283.17,765,1426.98,698.29\r
STRESS-0163,"Home & Kitchen Product 163",ES,Amazon,Home & Kitchen,29.64,82.99,15,3.62,19,5.8,61,TRUE,TRUE,3784.34,855,2743.65,1088.59\r
STRESS-0164,"Sports & Outdoors Product 164",DE,WooCommerce,Sports & Outdoors,26.18,60.43,14,3.85,20,5.8,417,TRUE,FALSE,2900.64,900,2102.96,875.16\r
STRESS-0165,"Beauty & Health Product 165",FR,Shopify,Beauty & Health,7.44,18.22,12,4.96,15,4.2,431,TRUE,TRUE,655.92,675,344.36,276.48\r
STRESS-0166,"Apparel Product 166",IT,Amazon,Apparel,27.01,76.67,15,5.76,18,6.3,495,FALSE,FALSE,3312.14,810,2608.31,963.04\r
STRESS-0167,"Pet Supplies Product 167",ES,WooCommerce,Pet Supplies,36.32,88.78,14,4.67,21,4.4,496,TRUE,TRUE,4474.51,945,2460.98,1276.13\r
STRESS-0168,"Electronics Product 168",DE,Shopify,Electronics,22.19,58.74,12,2.98,18,22.5,344,TRUE,TRUE,2537.57,810,7929.9,769.39\r
STRESS-0169,"Home & Kitchen Product 169",FR,Amazon,Home & Kitchen,20.4,46.11,12,3.04,25,2.4,93,TRUE,TRUE,2766.6,1125,829.98,879.15\r
STRESS-0170,"Sports & Outdoors Product 170",IT,WooCommerce,Sports & Outdoors,25.49,49.09,12,5.07,6,5.5,91,TRUE,FALSE,706.9,270,485.99,221.72\r
STRESS-0171,"Beauty & Health Product 171",ES,Shopify,Beauty & Health,9.17,16.62,12,4.93,11,2.1,365,TRUE,TRUE,438.77,495,115.18,192.19\r
STRESS-0172,"Apparel Product 172",DE,Amazon,Apparel,8.1,23.11,13,5.17,1,6.1,386,TRUE,TRUE,55.46,45,42.29,21.37\r
STRESS-0173,"Pet Supplies Product 173",FR,WooCommerce,Pet Supplies,38.41,86.08,13,5.61,2,4.3,365,TRUE,FALSE,413.18,90,222.09,118.3\r
STRESS-0174,"Electronics Product 174",IT,Shopify,Electronics,9.33,15.59,13,4.33,9,3.8,165,TRUE,TRUE,336.74,405,159.95,151.69\r
STRESS-0175,"Home & Kitchen Product 175",ES,Amazon,Home & Kitchen,36.04,70.33,13,4.26,17,6.1,70,TRUE,FALSE,2869.46,765,2187.97,844.87\r
STRESS-0176,"Sports & Outdoors Product 176",DE,WooCommerce,Sports & Outdoors,78.52,72.7,12,5.47,16,2.8,344,FALSE,FALSE,2791.68,720,977.09,817.92\r
STRESS-0177,"Beauty & Health Product 177",FR,Shopify,Beauty & Health,30.59,63.89,15,4.89,21,3.2,166,FALSE,FALSE,3220.06,945,1288.02,962.51\r
STRESS-0178,"Apparel Product 178",IT,Amazon,Apparel,48.13,80.86,15,5.99,17,5,139,TRUE,FALSE,3299.09,765,2061.93,952.27\r
STRESS-0179,"Pet Supplies Product 179",ES,WooCommerce,Pet Supplies,45.67,79.06,13,5.18,15,6.9,379,FALSE,TRUE,2846.16,675,2454.81,824.04\r
STRESS-0180,"Electronics Product 180",DE,Shopify,Electronics,33.29,63.97,12,5.99,4,2.3,381,TRUE,TRUE,614.11,180,176.56,183.53\r
STRESS-0181,"Home & Kitchen Product 181",FR,Amazon,Home & Kitchen,50.99,98.4,15,2.86,12,5.7,69,TRUE,TRUE,2833.92,540,2019.17,798.48\r
STRESS-0182,"Sports & Outdoors Product 182",IT,WooCommerce,Sports & Outdoors,32.39,57.67,15,2.73,25,6.5,113,TRUE,TRUE,3460.2,1125,2811.41,1052.55\r
STRESS-0183,"Beauty & Health Product 183",ES,Shopify,Beauty & Health,35.71,95.77,12,3.39,13,3.2,401,TRUE,TRUE,2988.02,585,1195.21,844.51\r
STRESS-0184,"Apparel Product 184",DE,Amazon,Apparel,15.14,34.03,15,15.31,3,3.5,421,TRUE,TRUE,245.02,135,107.19,83.75\r
STRESS-0185,"Pet Supplies Product 185",FR,WooCommerce,Pet Supplies,51.34,95.86,14,5.15,17,3.2,131,TRUE,FALSE,3911.09,765,1564.44,1105.27\r
STRESS-0186,"Electronics Product 186",IT,Shopify,Electronics,20.69,42.7,15,4.5,13,6.8,116,TRUE,TRUE,1332.24,585,1132.4,430.56\r
STRESS-0187,"Home & Kitchen Product 187",ES,Amazon,Home & Kitchen,23.76,42.19,13,2.88,23,5.5,163,TRUE,FALSE,2328.89,1035,1601.11,754.72\r
STRESS-0188,"Sports & Outdoors Product 188",DE,WooCommerce,Sports & Outdoors,26.72,55.33,12,4.68,21,2.2,195,TRUE,FALSE,2788.63,945,766.87,854.66\r
STRESS-0189,"Beauty & Health Product 189",FR,Shopify,Beauty & Health,36.38,88.7,14,2.86,24,5.7,360,TRUE,TRUE,5109.12,1080,3640.25,1457.28\r
STRESS-0190,"Apparel Product 190",IT,Amazon,Apparel,21.29,59.16,12,4.45,17,4.1,403,TRUE,TRUE,2413.73,765,1237.04,730.93\r
STRESS-0191,"Pet Supplies Product 191",ES,WooCommerce,Pet Supplies,23.35,59.15,13,2.68,23,2.4,301,TRUE,FALSE,3265.08,1035,979.52,988.77\r
STRESS-0192,"Electronics Product 192",DE,Shopify,Electronics,14.68,29.06,12,4.61,10,4,164,TRUE,FALSE,5666.7,450,348.72,249.36\r
STRESS-0193,"Home & Kitchen Product 193",FR,Amazon,Home & Kitchen,21.89,55.76,15,5.14,22,4.5,245,TRUE,TRUE,2944.13,990,1656.07,901.03\r
STRESS-0194,"Sports & Outdoors Product 194",IT,WooCommerce,Sports & Outdoors,36.49,68.97,14,5.95,7,5.9,395,FALSE,TRUE,1158.7,315,854.54,342.17\r
STRESS-0195,"Beauty & Health Product 195",ES,Shopify,Beauty & Health,55.31,97.25,13,4.46,4,2.9,62,TRUE,FALSE,933.6,180,338.43,263.4\r
STRESS-0196,"Apparel Product 196",DE,Amazon,Apparel,19.53,50.69,13,5.33,7,2.4,132,FALSE,FALSE,851.59,315,255.48,265.4\r
STRESS-0197,"Pet Supplies Product 197",FR,WooCommerce,Pet Supplies,8.6,22.27,12,4.34,7,4.1,142,TRUE,FALSE,374.14,315,191.74,146.03\r
STRESS-0198,"Electronics Product 198",IT,Shopify,Electronics,25.5,63.83,15,2.61,18,5.4,294,TRUE,TRUE,2757.46,810,1861.28,824.36\r
STRESS-0199,"Home & Kitchen Product 199",ES,Amazon,Home & Kitchen,12.05,24.27,15,3.57,8,4.2,324,TRUE,TRUE,465.98,360,244.64,176.5\r
STRESS-0200,"Sports & Outdoors Product 200",DE,WooCommerce,Sports & Outdoors,26.96,47.48,15,21.37,1,3.6,491,TRUE,TRUE,113.95,45,51.28,35.99\r
STRESS-0201,"Beauty & Health Product 201",FR,Shopify,Beauty & Health,25.89,68.77,15,4.73,5,2.1,275,TRUE,FALSE,825.24,225,216.63,243.81\r
STRESS-0202,"Apparel Product 202",IT,Amazon,Apparel,24.94,50.34,13,3.84,17,2.9,71,TRUE,FALSE,2053.87,765,744.53,640.97\r
STRESS-0203,"Pet Supplies Product 203",ES,WooCommerce,Pet Supplies,9.34,16.94,15,4.19,4,5.4,424,FALSE,FALSE,162.62,180,109.77,70.66\r
STRESS-0204,"Electronics Product 204",DE,Shopify,Electronics,22.92,43.88,13,2.93,18,6.6,431,TRUE,TRUE,1895.62,810,1563.88,608.9\r
STRESS-0205,"Home & Kitchen Product 205",FR,Amazon,Home & Kitchen,28.48,70.01,14,5.23,10,6.2,380,TRUE,FALSE,1680.24,450,1302.19,495.06\r
STRESS-0206,"Sports & Outdoors Product 206",IT,WooCommerce,Sports & Outdoors,12.36,20.96,12,2.91,24,5.4,81,TRUE,FALSE,1207.3,1080,814.92,481.82\r
STRESS-0207,"Beauty & Health Product 207",ES,Shopify,Beauty & Health,44.34,90.71,15,5.32,2,5.9,254,TRUE,FALSE,435.41,90,321.11,123.85\r
STRESS-0208,"Apparel Product 208",DE,Amazon,Apparel,56.43,52.25,15,5.01,18,3.5,104,FALSE,TRUE,2257.2,810,987.53,699.3\r
STRESS-0209,"Pet Supplies Product 209",FR,WooCommerce,Pet Supplies,14.11,25.47,14,2.56,13,3.1,449,TRUE,TRUE,794.66,585,307.93,296.17\r
STRESS-0210,"Electronics Product 210",IT,Shopify,Electronics,11.54,23.75,12,2.93,18,6.2,453,TRUE,FALSE,1026,810,795.15,391.5\r
STRESS-0211,"Home & Kitchen Product 211",ES,Amazon,Home & Kitchen,12.14,22.89,12,3.56,7,5.5,225,TRUE,TRUE,384.55,315,264.38,148.64\r
STRESS-0212,"Sports & Outdoors Product 212",DE,WooCommerce,Sports & Outdoors,26.92,52.19,15,3.57,23,4.8,373,TRUE,TRUE,2880.89,1035,1728.53,892.72\r
STRESS-0213,"Beauty & Health Product 213",FR,Shopify,Beauty & Health,33.91,79.95,12,5.04,14,6.7,455,TRUE,TRUE,2686.32,630,2249.79,776.58\r
STRESS-0214,"Apparel Product 214",IT,Amazon,Apparel,22.86,39.79,12,3.04,12,2.2,165,TRUE,TRUE,1145.95,540,315.14,376.49\r
STRESS-0215,"Pet Supplies Product 215",ES,WooCommerce,Pet Supplies,38.39,95.17,14,3.14,12,2,438,TRUE,FALSE,2740.9,540,685.22,775.22\r
STRESS-0216,"Electronics Product 216",DE,Shopify,Electronics,16.33,33.52,14,2.97,16,22.5,181,TRUE,FALSE,1287.17,720,4022.4,441.79\r
STRESS-0217,"Home & Kitchen Product 217",FR,Amazon,Home & Kitchen,16.89,33.53,12,5.97,18,2.8,180,TRUE,TRUE,1448.5,810,506.97,497.12\r
STRESS-0218,"Sports & Outdoors Product 218",IT,WooCommerce,Sports & Outdoors,28.75,78.99,12,5.75,9,6.6,367,TRUE,FALSE,1706.18,405,1407.6,494.05\r
STRESS-0219,"Beauty & Health Product 219",ES,Shopify,Beauty & Health,19.85,43.38,14,3.88,11,6.6,443,TRUE,FALSE,1145.23,495,944.82,368.81\r
STRESS-0220,"Apparel Product 220",DE,Amazon,Apparel,38.04,98.62,12,2.99,6,6.2,235,TRUE,TRUE,1420.13,270,1100.6,400.03\r
STRESS-0221,"Pet Supplies Product 221",FR,WooCommerce,Pet Supplies,15.99,31.66,13,3.23,18,5.2,390,TRUE,TRUE,1367.71,810,889.01,476.93\r
STRESS-0222,"Electronics Product 222",IT,Shopify,Electronics,36.16,75.62,15,5.66,12,5,475,TRUE,FALSE,2177.86,540,1361.16,634.46\r
STRESS-0223,"Home & Kitchen Product 223",ES,Amazon,Home & Kitchen,43.93,83.12,12,4.9,20,5,230,TRUE,FALSE,3989.76,900,2493.6,1147.44\r
STRESS-0224,"Sports & Outdoors Product 224",DE,WooCommerce,Sports & Outdoors,25.85,46.69,14,2.85,25,6.8,214,TRUE,FALSE,22761.38,1125,2381.19,887.85\r
STRESS-0225,"Beauty & Health Product 225",FR,Shopify,Beauty & Health,28.11,67.31,13,5.35,13,2.6,425,TRUE,FALSE,2100.07,585,682.52,622.52\r
STRESS-0226,"Apparel Product 226",IT,Amazon,Apparel,16.44,36.73,15,4.67,6,6,387,FALSE,TRUE,528.91,270,396.68,177.23\r
STRESS-0227,"Pet Supplies Product 227",ES,WooCommerce,Pet Supplies,43.97,81.41,12,3.36,19,6.6,489,TRUE,TRUE,3712.3,855,3062.64,1070.57\r
STRESS-0228,"Electronics Product 228",DE,Shopify,Electronics,47.67,93.2,13,3.86,20,5.3,232,TRUE,TRUE,4473.6,900,2963.76,1268.4\r
STRESS-0229,"Home & Kitchen Product 229",FR,Amazon,Home & Kitchen,15.16,28.43,15,3.75,25,4.1,409,TRUE,TRUE,1705.8,1125,874.22,613.95\r
STRESS-0230,"Sports & Outdoors Product 230",IT,WooCommerce,Sports & Outdoors,28.14,67.4,14,5.22,16,6.7,265,TRUE,TRUE,2588.16,720,2167.58,767.04\r
STRESS-0231,"Beauty & Health Product 231",ES,Shopify,Beauty & Health,8.2,20.75,14,3.43,11,4.1,279,FALSE,FALSE,547.8,495,280.75,219.45\r
STRESS-0232,"Apparel Product 232",DE,Amazon,Apparel,38.07,64.46,13,29.01,1,2.2,281,TRUE,TRUE,154.7,45,42.54,46.18\r
STRESS-0233,"Pet Supplies Product 233",FR,WooCommerce,Pet Supplies,47.53,90.13,15,3.81,14,4.7,222,TRUE,TRUE,3028.37,630,1779.17,862.09\r
STRESS-0234,"Electronics Product 234",IT,Shopify,Electronics,41.06,88.25,13,3.85,3,6.4,215,FALSE,TRUE,635.4,135,508.32,181.35\r
STRESS-0235,"Home & Kitchen Product 235",ES,Amazon,Home & Kitchen,40.26,78.04,13,5.89,18,5.2,286,FALSE,FALSE,3371.33,810,2191.36,977.83\r
STRESS-0236,"Sports & Outdoors Product 236",DE,WooCommerce,Sports & Outdoors,18.54,38.29,13,5.15,4,5,54,FALSE,TRUE,367.58,180,229.74,121.9\r
STRESS-0237,"Beauty & Health Product 237",FR,Shopify,Beauty & Health,40.26,82.28,14,5.09,9,7,75,FALSE,FALSE,1777.25,405,1555.09,511.81\r
STRESS-0238,"Apparel Product 238",IT,Amazon,Apparel,9.01,16.96,14,4.86,18,2.2,70,FALSE,FALSE,732.67,810,201.48,318.17\r
STRESS-0239,"Pet Supplies Product 239",ES,WooCommerce,Pet Supplies,10.39,22.29,13,5.94,3,4,128,TRUE,TRUE,160.49,135,80.24,62.62\r
STRESS-0240,"Electronics Product 240",DE,Shopify,Electronics,25.32,67.97,13,2.93,4,22.5,315,TRUE,TRUE,652.51,180,2039.1,193.13\r
STRESS-0241,"Home & Kitchen Product 241",FR,Amazon,Home & Kitchen,19.74,54.52,15,4.22,8,2.3,446,TRUE,TRUE,1046.78,360,300.95,321.7\r
STRESS-0242,"Sports & Outdoors Product 242",IT,WooCommerce,Sports & Outdoors,8.78,16.58,12,4.72,24,5.2,494,TRUE,FALSE,955.01,1080,620.76,418.75\r
STRESS-0243,"Beauty & Health Product 243",ES,Shopify,Beauty & Health,13.82,36.12,14,2.82,21,5.6,359,TRUE,TRUE,1820.45,945,1274.31,612.61\r
STRESS-0244,"Apparel Product 244",DE,Amazon,Apparel,28.81,48.1,15,5.84,25,2.8,332,TRUE,TRUE,2886,1125,1010.1,909\r
STRESS-0245,"Pet Supplies Product 245",FR,WooCommerce,Pet Supplies,17.74,31.82,13,3.53,20,4.3,149,TRUE,TRUE,1527.36,900,820.96,531.84\r
STRESS-0246,"Electronics Product 246",IT,Shopify,Electronics,49.34,94.75,14,3.68,8,7,435,TRUE,TRUE,1819.2,360,1591.8,514.8\r
STRESS-0247,"Home & Kitchen Product 247",ES,Amazon,Home & Kitchen,38.46,72.52,12,5.01,6,2.2,114,TRUE,FALSE,1044.29,270,287.18,306.07\r
STRESS-0248,"Sports & Outdoors Product 248",DE,WooCommerce,Sports & Outdoors,15.86,37.04,15,16.67,15,3,408,TRUE,TRUE,1333.44,675,500.04,445.86\r
STRESS-0249,"Beauty & Health Product 249",FR,Shopify,Beauty & Health,20.45,35.14,15,2.54,8,2.7,407,TRUE,TRUE,674.69,360,227.71,228.67\r
STRESS-0250,"Apparel Product 250",IT,Amazon,Apparel,22.4,59.37,14,3.92,5,4.4,471,TRUE,FALSE,712.44,225,391.84,215.61\r
STRESS-0251,"Pet Supplies Product 251",ES,WooCommerce,Pet Supplies,37.29,64.23,15,4.93,3,5,367,TRUE,FALSE,462.46,135,289.04,138.11\r
STRESS-0252,"Electronics Product 252",DE,Shopify,Electronics,47.45,97.08,12,5.34,16,5,212,TRUE,TRUE,3727.87,720,2329.92,1051.97\r
STRESS-0253,"Home & Kitchen Product 253",FR,Amazon,Home & Kitchen,10.04,17.82,15,2.84,7,5.5,440,TRUE,TRUE,299.38,315,205.82,127.34\r
STRESS-0254,"Sports & Outdoors Product 254",IT,WooCommerce,Sports & Outdoors,42.59,92.15,14,3.57,5,6,99,TRUE,FALSE,1105.8,225,829.35,313.95\r
STRESS-0255,"Beauty & Health Product 255",ES,Shopify,Beauty & Health,52.02,94.76,12,3.16,1,5,368,TRUE,TRUE,227.42,45,142.14,64.36\r
STRESS-0256,"Apparel Product 256",DE,Amazon,Apparel,52.43,94.39,15,3.18,2,6.3,363,TRUE,FALSE,3681.21,90,356.79,128.27\r
STRESS-0257,"Pet Supplies Product 257",FR,WooCommerce,Pet Supplies,27.27,69.62,12,5.05,2,6.1,313,TRUE,TRUE,334.18,90,254.81,98.54\r
STRESS-0258,"Electronics Product 258",IT,Shopify,Electronics,36.45,98.16,15,3.66,12,6.3,86,TRUE,TRUE,2827.01,540,2226.27,796.75\r
STRESS-0259,"Home & Kitchen Product 259",ES,Amazon,Home & Kitchen,32.4,86.04,12,5.37,19,4.9,152,TRUE,TRUE,3923.42,855,2403.1,1123.36\r
STRESS-0260,"Sports & Outdoors Product 260",DE,WooCommerce,Sports & Outdoors,36.82,92.53,14,4.05,5,3.7,452,FALSE,TRUE,1110.36,225,513.54,315.09\r
STRESS-0261,"Beauty & Health Product 261",FR,Shopify,Beauty & Health,34.9,71.72,14,5.76,7,7,368,TRUE,TRUE,1204.9,315,1054.28,353.72\r
STRESS-0262,"Apparel Product 262",IT,Amazon,Apparel,34.23,90.32,12,3.95,22,2.5,409,TRUE,TRUE,4768.9,990,1490.28,1357.22\r
STRESS-0263,"Pet Supplies Product 263",ES,WooCommerce,Pet Supplies,10.9,24.03,14,3.57,6,3.8,74,TRUE,FALSE,346.03,270,164.37,131.51\r
STRESS-0264,"Electronics Product 264",DE,Shopify,Electronics,18.66,39.01,13,4.39,6,22.5,275,TRUE,TRUE,561.74,270,1755.45,185.44\r
STRESS-0265,"Home & Kitchen Product 265",FR,Amazon,Home & Kitchen,24.97,47.09,15,2.88,18,6.1,171,TRUE,FALSE,2034.29,810,1551.14,643.57\r
STRESS-0266,"Sports & Outdoors Product 266",IT,WooCommerce,Sports & Outdoors,33.63,64.34,14,3.13,10,3.8,175,TRUE,TRUE,1544.16,450,733.48,461.04\r
STRESS-0267,"Beauty & Health Product 267",ES,Shopify,Beauty & Health,29.46,64.89,12,3.34,17,4.1,128,TRUE,TRUE,2647.51,765,1356.85,789.38\r
STRESS-0268,"Apparel Product 268",DE,Amazon,Apparel,9.66,16.19,15,4.2,18,6.3,375,FALSE,FALSE,699.41,810,550.78,309.85\r
STRESS-0269,"Pet Supplies Product 269",FR,WooCommerce,Pet Supplies,50.86,91.85,12,4.89,18,3,468,TRUE,TRUE,3967.92,810,1487.97,1126.98\r
STRESS-0270,"Electronics Product 270",IT,Shopify,Electronics,29.56,50.7,15,5.49,8,3.1,183,TRUE,TRUE,973.44,360,377.21,303.36\r
STRESS-0271,"Home & Kitchen Product 271",ES,Amazon,Home & Kitchen,22.23,55.55,13,5.3,6,4,125,TRUE,TRUE,799.92,270,399.96,244.98\r
STRESS-0272,"Sports & Outdoors Product 272",DE,WooCommerce,Sports & Outdoors,57.81,53.53,14,3.61,21,4.2,366,TRUE,TRUE,2697.91,945,1416.4,831.98\r
STRESS-0273,"Beauty & Health Product 273",FR,Shopify,Beauty & Health,41.13,69.69,14,5.43,19,2,60,FALSE,FALSE,3177.86,855,794.47,936.97\r
STRESS-0274,"Apparel Product 274",IT,Amazon,Apparel,16.6,31.59,13,5.81,23,6.6,331,TRUE,TRUE,1743.77,1035,1438.61,608.44\r
STRESS-0275,"Pet Supplies Product 275",ES,WooCommerce,Pet Supplies,28.87,63.72,14,4.22,10,2.4,129,TRUE,FALSE,1529.28,450,458.78,457.32\r
STRESS-0276,"Electronics Product 276",DE,Shopify,Electronics,21.79,49.92,14,3.91,25,3,348,TRUE,TRUE,2995.2,1125,1123.2,936.3\r
STRESS-0277,"Home & Kitchen Product 277",FR,Amazon,Home & Kitchen,15.34,37.51,14,4.31,10,6.9,313,TRUE,FALSE,900.24,450,776.46,300.06\r
STRESS-0278,"Sports & Outdoors Product 278",IT,WooCommerce,Sports & Outdoors,14.3,26.95,12,5.32,4,6.9,405,TRUE,FALSE,258.72,180,223.15,94.68\r
STRESS-0279,"Beauty & Health Product 279",ES,Shopify,Beauty & Health,23,48.66,12,3.22,18,4,184,TRUE,TRUE,2102.11,810,1051.06,660.53\r
STRESS-0280,"Apparel Product 280",DE,Amazon,Apparel,14.71,35.68,14,16.06,20,4.1,51,TRUE,TRUE,1712.64,900,877.73,578.16\r
STRESS-0281,"Pet Supplies Product 281",FR,WooCommerce,Pet Supplies,40.16,96.71,13,3.08,23,2.5,435,TRUE,TRUE,5338.39,1035,1668.25,1507.1\r
STRESS-0282,"Electronics Product 282",IT,Shopify,Electronics,44.61,79.94,15,4.27,21,2.1,293,TRUE,TRUE,4028.98,945,1057.61,1164.74\r
STRESS-0283,"Home & Kitchen Product 283",ES,Amazon,Home & Kitchen,25.78,55.36,14,3.41,18,6.7,313,TRUE,TRUE,2391.55,810,2002.92,732.89\r
STRESS-0284,"Sports & Outdoors Product 284",DE,WooCommerce,Sports & Outdoors,49.35,90.42,12,5.45,11,2.3,365,TRUE,TRUE,2387.09,495,686.29,679.27\r
STRESS-0285,"Beauty & Health Product 285",FR,Shopify,Beauty & Health,31.06,85.87,14,5.67,10,4.4,70,FALSE,TRUE,2060.88,450,1133.48,590.22\r
STRESS-0286,"Apparel Product 286",IT,Amazon,Apparel,28.2,63.56,12,4.67,3,5.9,272,TRUE,TRUE,457.63,135,337.5,136.91\r
STRESS-0287,"Pet Supplies Product 287",ES,WooCommerce,Pet Supplies,24.29,40.89,15,2.94,9,2.7,53,TRUE,FALSE,883.22,405,298.09,288.31\r
STRESS-0288,"Electronics Product 288",DE,Shopify,Electronics,7.18,18.82,12,4.76,3,4.8,299,TRUE,FALSE,1100.97,135,81.3,56.38\r
STRESS-0289,"Home & Kitchen Product 289",FR,Amazon,Home & Kitchen,35.43,61.71,12,2.79,4,5.9,207,TRUE,TRUE,592.42,180,436.91,178.1\r
STRESS-0290,"Sports & Outdoors Product 290",IT,WooCommerce,Sports & Outdoors,5.72,16.32,14,5.46,15,6.9,340,TRUE,FALSE,587.52,675,506.74,259.38\r
STRESS-0291,"Beauty & Health Product 291",ES,Shopify,Beauty & Health,37.76,78.03,15,2.7,17,2.7,65,FALSE,FALSE,3183.62,765,1074.47,923.41\r
STRESS-0292,"Apparel Product 292",DE,Amazon,Apparel,40.84,98.05,14,2.7,7,3.9,112,TRUE,TRUE,1647.24,315,803.03,464.31\r
STRESS-0293,"Pet Supplies Product 293",FR,WooCommerce,Pet Supplies,33.3,71.65,14,4.04,12,3.7,284,FALSE,TRUE,2063.52,540,954.38,605.88\r
STRESS-0294,"Electronics Product 294",IT,Shopify,Electronics,16.09,35.96,14,4.52,23,5.5,366,TRUE,TRUE,1984.99,1035,1364.68,668.75\r
STRESS-0295,"Home & Kitchen Product 295",ES,Amazon,Home & Kitchen,33.78,87.48,12,5.38,7,6.6,386,TRUE,TRUE,1469.66,315,1212.47,419.92\r
STRESS-0296,"Sports & Outdoors Product 296",DE,WooCommerce,Sports & Outdoors,24,66.49,15,29.92,9,2.1,283,TRUE,TRUE,1436.18,405,377,426.55\r
STRESS-0297,"Beauty & Health Product 297",FR,Shopify,Beauty & Health,15.47,37.3,15,3.52,10,6.9,256,TRUE,TRUE,895.2,450,772.11,298.8\r
STRESS-0298,"Apparel Product 298",IT,Amazon,Apparel,29.28,56.79,12,5.44,18,3.8,256,TRUE,FALSE,2453.33,810,1165.33,748.33\r
STRESS-0299,"Pet Supplies Product 299",ES,WooCommerce,Pet Supplies,30.92,56.25,13,3.25,12,4.4,303,TRUE,TRUE,1620,540,891,495\r
STRESS-0300,"Electronics Product 300",DE,Shopify,Electronics,34.18,89.69,14,3.9,7,5.1,77,FALSE,FALSE,1506.79,315,960.58,429.2\r
STRESS-0301,"Home & Kitchen Product 301",FR,Amazon,Home & Kitchen,33.26,79.64,13,4.16,15,6.2,338,TRUE,FALSE,2867.04,675,2221.96,829.26\r
STRESS-0302,"Sports & Outdoors Product 302",IT,WooCommerce,Sports & Outdoors,12.87,27.19,13,3.21,3,4.8,336,TRUE,FALSE,195.77,135,117.46,71.44\r
STRESS-0303,"Beauty & Health Product 303",ES,Shopify,Beauty & Health,10.25,21.1,15,2.89,22,5.3,64,TRUE,FALSE,1114.08,990,738.08,443.52\r
STRESS-0304,"Apparel Product 304",DE,Amazon,Apparel,71.37,66.08,12,2.71,10,6.3,470,TRUE,TRUE,1585.92,450,1248.91,471.48\r
STRESS-0305,"Pet Supplies Product 305",FR,WooCommerce,Pet Supplies,10.17,22.85,12,5.97,24,5.3,214,TRUE,TRUE,1316.16,1080,871.96,509.04\r
STRESS-0306,"Electronics Product 306",IT,Shopify,Electronics,36.03,90.17,14,4.59,24,3.6,461,TRUE,TRUE,5193.79,1080,2337.21,1478.45\r
STRESS-0307,"Home & Kitchen Product 307",ES,Amazon,Home & Kitchen,18.72,52,15,3.15,9,3.5,186,TRUE,FALSE,1123.2,405,491.4,348.3\r
STRESS-0308,"Sports & Outdoors Product 308",DE,WooCommerce,Sports & Outdoors,14.71,30.65,12,5.53,12,3.9,96,TRUE,TRUE,882.72,540,430.33,310.68\r
STRESS-0309,"Beauty & Health Product 309",FR,Shopify,Beauty & Health,35.75,65,15,4.47,12,5.4,91,TRUE,FALSE,1872,540,1263.6,558\r
STRESS-0310,"Apparel Product 310",IT,Amazon,Apparel,21.82,51.18,12,2.99,20,3.3,99,TRUE,FALSE,2456.64,900,1013.36,764.16\r
STRESS-0311,"Pet Supplies Product 311",ES,WooCommerce,Pet Supplies,37.7,67.01,15,4.55,13,6.3,119,TRUE,FALSE,2090.71,585,1646.44,620.18\r
STRESS-0312,"Electronics Product 312",DE,Shopify,Electronics,7.12,16.55,14,3.43,11,22.5,456,TRUE,FALSE,436.92,495,1365.38,191.73\r
STRESS-0313,"Home & Kitchen Product 313",FR,Amazon,Home & Kitchen,18.99,34.98,15,4.27,3,5.8,232,TRUE,TRUE,251.86,135,182.6,85.46\r
STRESS-0314,"Sports & Outdoors Product 314",IT,WooCommerce,Sports & Outdoors,32.56,73.43,14,3.81,8,3,354,TRUE,FALSE,1409.86,360,528.7,412.46\r
STRESS-0315,"Beauty & Health Product 315",ES,Shopify,Beauty & Health,55.12,96.21,15,3.11,18,2.7,385,FALSE,TRUE,4156.27,810,1402.74,1174.07\r
STRESS-0316,"Apparel Product 316",DE,Amazon,Apparel,23.8,50.64,12,4.95,11,6,294,TRUE,TRUE,1336.9,495,1002.67,416.72\r
STRESS-0317,"Pet Supplies Product 317",FR,WooCommerce,Pet Supplies,12.05,31.45,13,5.04,4,5.4,199,FALSE,TRUE,301.92,180,203.8,105.48\r
STRESS-0318,"Electronics Product 318",IT,Shopify,Electronics,21.34,57.57,12,4.54,3,6.5,55,TRUE,TRUE,414.5,135,336.78,126.13\r
STRESS-0319,"Home & Kitchen Product 319",ES,Amazon,Home & Kitchen,9.92,18.38,13,2.97,11,4.4,260,TRUE,TRUE,485.23,495,266.88,203.81\r
STRESS-0320,"Sports & Outdoors Product 320",DE,WooCommerce,Sports & Outdoors,16.97,45.13,13,5.01,9,5.4,85,TRUE,TRUE,7920.32,405,658,311.2\r
STRESS-0321,"Beauty & Health Product 321",FR,Shopify,Beauty & Health,37.41,75.8,12,4.83,21,4.3,79,TRUE,TRUE,3820.32,945,2053.42,1112.58\r
STRESS-0322,"Apparel Product 322",IT,Amazon,Apparel,16.01,28.42,12,2.61,4,6.8,172,TRUE,FALSE,272.83,180,231.91,98.21\r
STRESS-0323,"Pet Supplies Product 323",ES,WooCommerce,Pet Supplies,14.56,25.6,15,2.7,7,2.5,291,TRUE,FALSE,430.08,315,134.4,160.02\r
STRESS-0324,"Electronics Product 324",DE,Shopify,Electronics,23.17,48.89,13,2.79,21,4.2,368,TRUE,FALSE,2464.06,945,1293.63,773.51\r
STRESS-0325,"Home & Kitchen Product 325",FR,Amazon,Home & Kitchen,45.19,87.16,14,4.32,22,2.9,205,TRUE,TRUE,4602.05,990,1668.24,1315.51\r
STRESS-0326,"Sports & Outdoors Product 326",IT,WooCommerce,Sports & Outdoors,22.99,48.04,14,3.53,6,3,318,TRUE,FALSE,691.78,270,259.42,217.94\r
STRESS-0327,"Beauty & Health Product 327",ES,Shopify,Beauty & Health,16.63,32.07,15,5.24,14,4.4,152,TRUE,TRUE,1077.55,630,592.65,374.39\r
STRESS-0328,"Apparel Product 328",DE,Amazon,Apparel,31.81,68.24,12,30.71,10,2.3,263,TRUE,TRUE,1637.76,450,470.86,484.44\r
STRESS-0329,"Pet Supplies Product 329",FR,WooCommerce,Pet Supplies,22.75,64.07,15,2.74,13,6.4,55,TRUE,TRUE,1998.98,585,1599.19,597.25\r
STRESS-0330,"Electronics Product 330",IT,Shopify,Electronics,35.69,65.38,13,2.79,14,6.5,70,TRUE,TRUE,2196.77,630,1784.87,654.19\r
STRESS-0331,"Home & Kitchen Product 331",ES,Amazon,Home & Kitchen,37.08,89.75,12,4.73,5,2.9,440,FALSE,TRUE,1077,225,390.41,306.75\r
STRESS-0332,"Sports & Outdoors Product 332",DE,WooCommerce,Sports & Outdoors,24.97,48.17,12,5.5,3,5.4,353,TRUE,TRUE,346.82,135,234.11,109.21\r
STRESS-0333,"Beauty & Health Product 333",FR,Shopify,Beauty & Health,13.67,38.51,12,5.75,14,3.9,268,TRUE,TRUE,1293.94,630,630.79,428.48\r
STRESS-0334,"Apparel Product 334",IT,Amazon,Apparel,24.43,49.32,12,3.06,24,6.5,312,TRUE,TRUE,2840.83,1080,2308.18,890.21\r
STRESS-0335,"Pet Supplies Product 335",ES,WooCommerce,Pet Supplies,28.26,69.61,14,5.44,14,3.3,54,TRUE,FALSE,2338.9,630,964.79,689.72\r
STRESS-0336,"Electronics Product 336",DE,Shopify,Electronics,16.17,31.3,12,4.7,3,22.5,313,TRUE,FALSE,225.36,135,704.25,78.84\r
STRESS-0337,"Home & Kitchen Product 337",FR,Amazon,Home & Kitchen,27.79,69.08,13,2.84,15,6.7,148,TRUE,TRUE,2486.88,675,2082.76,734.22\r
STRESS-0338,"Sports & Outdoors Product 338",IT,WooCommerce,Sports & Outdoors,42.55,92.85,14,3.51,4,3.2,463,TRUE,FALSE,891.36,180,356.54,252.84\r
STRESS-0339,"Beauty & Health Product 339",ES,Shopify,Beauty & Health,17.57,33.58,14,3.17,8,3.7,233,TRUE,TRUE,644.74,360,298.19,221.18\r
STRESS-0340,"Apparel Product 340",DE,Amazon,Apparel,10.74,23.03,14,3.65,21,5.8,187,TRUE,FALSE,1160.71,945,841.52,447.68\r
STRESS-0341,"Pet Supplies Product 341",FR,WooCommerce,Pet Supplies,19.93,51.72,14,2.66,24,3.7,211,TRUE,FALSE,2979.07,1080,1377.82,924.77\r
STRESS-0342,"Electronics Product 342",IT,Shopify,Electronics,13.02,27.62,15,3.6,2,2.6,83,TRUE,FALSE,132.58,90,43.09,48.14\r
STRESS-0343,"Home & Kitchen Product 343",ES,Amazon,Home & Kitchen,11.68,23.57,12,3.77,17,6.3,353,TRUE,FALSE,961.66,765,757.3,367.91\r
STRESS-0344,"Sports & Outdoors Product 344",DE,WooCommerce,Sports & Outdoors,27.27,47.75,13,21.49,19,3,417,FALSE,TRUE,2177.4,855,816.52,686.85\r
STRESS-0345,"Beauty & Health Product 345",FR,Shopify,Beauty & Health,32.88,82.37,14,5.23,16,5.4,111,TRUE,TRUE,3163.01,720,2135.03,910.75\r
STRESS-0346,"Apparel Product 346",IT,Amazon,Apparel,36.91,64.21,14,5.3,2,6.6,478,TRUE,TRUE,308.21,90,254.27,92.05\r
STRESS-0347,"Pet Supplies Product 347",ES,WooCommerce,Pet Supplies,29.6,55.06,14,3.71,9,3.5,413,FALSE,FALSE,1189.3,405,520.32,364.82\r
STRESS-0348,"Electronics Product 348",DE,Shopify,Electronics,30.46,52.01,14,2.94,22,3.6,310,TRUE,FALSE,2746.13,990,1235.76,851.53\r
STRESS-0349,"Home & Kitchen Product 349",FR,Amazon,Home & Kitchen,49.51,87.17,12,4.6,2,2.1,401,TRUE,FALSE,418.42,90,109.83,119.6\r
STRESS-0350,"Sports & Outdoors Product 350",IT,WooCommerce,Sports & Outdoors,43.03,84.75,13,5.41,13,6.9,179,TRUE,TRUE,2644.2,585,2280.62,758.55\r
STRESS-0351,"Beauty & Health Product 351",ES,Shopify,Beauty & Health,9.6,19.19,12,5.76,2,2.2,455,TRUE,TRUE,92.11,90,25.33,38.03\r
STRESS-0352,"Apparel Product 352",DE,Amazon,Apparel,34.43,97.02,14,3.21,16,6.8,154,FALSE,TRUE,30270.24,720,3166.73,1051.39\r
STRESS-0353,"Pet Supplies Product 353",FR,WooCommerce,Pet Supplies,41.4,92.32,13,4.14,1,5.6,466,TRUE,FALSE,221.57,45,155.1,62.89\r
STRESS-0354,"Electronics Product 354",IT,Shopify,Electronics,45.95,80.81,12,5.64,10,3.7,385,TRUE,TRUE,1939.44,450,896.99,559.86\r
STRESS-0355,"Home & Kitchen Product 355",ES,Amazon,Home & Kitchen,26.56,68.29,13,3.38,14,4,394,TRUE,TRUE,2294.54,630,1147.27,678.64\r
STRESS-0356,"Sports & Outdoors Product 356",DE,WooCommerce,Sports & Outdoors,14.81,28.93,14,2.98,12,4.6,161,TRUE,TRUE,833.18,540,479.08,298.3\r
STRESS-0357,"Beauty & Health Product 357",FR,Shopify,Beauty & Health,32.69,61.64,12,3.44,16,6.2,411,TRUE,FALSE,2366.98,720,1834.41,711.74\r
STRESS-0358,"Apparel Product 358",IT,Amazon,Apparel,44.44,85.7,14,5.95,13,2.9,90,TRUE,TRUE,2673.84,585,969.27,765.96\r
STRESS-0359,"Pet Supplies Product 359",ES,WooCommerce,Pet Supplies,22.33,41.34,15,5.09,18,2.5,176,FALSE,FALSE,1785.89,810,558.09,581.47\r
STRESS-0360,"Electronics Product 360",DE,Shopify,Electronics,17.21,46.65,14,5.12,11,22.5,320,TRUE,FALSE,1231.56,495,3848.63,390.39\r
STRESS-0361,"Home & Kitchen Product 361",FR,Amazon,Home & Kitchen,15.31,36.45,13,3.55,4,3.2,389,TRUE,FALSE,349.92,180,139.97,117.48\r
STRESS-0362,"Sports & Outdoors Product 362",IT,WooCommerce,Sports & Outdoors,45.33,96.57,15,3.44,19,3.5,330,TRUE,TRUE,4403.59,855,1926.57,1243.4\r
STRESS-0363,"Beauty & Health Product 363",ES,Shopify,Beauty & Health,44.57,76.83,15,2.8,19,6.6,345,TRUE,FALSE,3503.45,855,2890.34,1018.36\r
STRESS-0364,"Apparel Product 364",DE,Amazon,Apparel,13.41,38.28,15,4.16,25,5.7,406,TRUE,TRUE,2296.8,1125,1636.47,761.7\r
STRESS-0365,"Pet Supplies Product 365",FR,WooCommerce,Pet Supplies,34.84,58.3,14,5.35,16,3.6,399,TRUE,FALSE,2238.72,720,1007.42,679.68\r
STRESS-0366,"Electronics Product 366",IT,Shopify,Electronics,39.69,77.89,13,2.68,8,4.7,211,TRUE,TRUE,1495.49,360,878.6,433.87\r
STRESS-0367,"Home & Kitchen Product 367",ES,Amazon,Home & Kitchen,44.67,76.82,12,5.98,20,4.7,491,TRUE,FALSE,3687.36,900,2166.32,1071.84\r
STRESS-0368,"Sports & Outdoors Product 368",DE,WooCommerce,Sports & Outdoors,90.05,83.38,12,5.38,25,2.6,401,TRUE,FALSE,5002.8,1125,1625.91,1438.2\r
STRESS-0369,"Beauty & Health Product 369",FR,Shopify,Beauty & Health,25.91,56.63,15,4.21,4,2.4,126,TRUE,TRUE,543.65,180,163.09,165.91\r
STRESS-0370,"Apparel Product 370",IT,Amazon,Apparel,28.7,74.28,13,5.44,14,6.4,340,TRUE,TRUE,2495.81,630,1996.65,728.95\r
STRESS-0371,"Pet Supplies Product 371",ES,WooCommerce,Pet Supplies,17.53,42.44,14,5.5,5,4.9,369,FALSE,TRUE,509.28,225,311.93,164.82\r
STRESS-0372,"Electronics Product 372",DE,Shopify,Electronics,14.45,34.61,14,4.38,14,6.3,367,FALSE,TRUE,1162.9,630,915.78,395.72\r
STRESS-0373,"Home & Kitchen Product 373",FR,Amazon,Home & Kitchen,29.88,74.53,14,2.63,18,3.6,280,TRUE,TRUE,3219.7,810,1448.86,939.92\r
STRESS-0374,"Sports & Outdoors Product 374",IT,WooCommerce,Sports & Outdoors,21.07,56.85,15,4.92,23,6.1,114,FALSE,TRUE,3138.12,1035,2392.82,957.03\r
STRESS-0375,"Beauty & Health Product 375",ES,Shopify,Beauty & Health,53.35,91.93,13,4.69,20,5,482,FALSE,TRUE,4412.64,900,2757.9,1253.16\r
STRESS-0376,"Apparel Product 376",DE,Amazon,Apparel,12.22,23.43,12,10.54,6,6.6,226,FALSE,TRUE,337.39,270,278.35,129.35\r
STRESS-0377,"Pet Supplies Product 377",FR,WooCommerce,Pet Supplies,20.81,37.02,14,4.07,9,3.2,279,TRUE,TRUE,799.63,405,319.85,267.41\r
STRESS-0378,"Electronics Product 378",IT,Shopify,Electronics,41.43,83.3,14,3.24,22,3.8,245,TRUE,TRUE,4398.24,990,2089.16,1264.56\r
STRESS-0379,"Home & Kitchen Product 379",ES,Amazon,Home & Kitchen,41.65,99.02,15,4.3,18,4.6,401,TRUE,TRUE,4277.66,810,2459.66,1204.42\r
STRESS-0380,"Sports & Outdoors Product 380",DE,WooCommerce,Sports & Outdoors,6.04,16.05,14,2.93,14,2.2,82,TRUE,TRUE,539.28,630,148.3,239.82\r
STRESS-0381,"Beauty & Health Product 381",FR,Shopify,Beauty & Health,40.91,72.57,14,4.34,1,3.6,260,TRUE,FALSE,174.17,45,78.38,51.04\r
STRESS-0382,"Apparel Product 382",IT,Amazon,Apparel,42.93,98.59,14,5.61,10,4,338,FALSE,FALSE,2366.16,450,1183.08,666.54\r
STRESS-0383,"Pet Supplies Product 383",ES,WooCommerce,Pet Supplies,8.89,15.35,15,3.58,25,4.5,391,TRUE,TRUE,921,1125,518.06,417.75\r
STRESS-0384,"Electronics Product 384",DE,Shopify,Electronics,18.47,51.69,15,3.9,17,3.4,412,TRUE,TRUE,17135.24,765,896.3,654.74\r
STRESS-0385,"Home & Kitchen Product 385",FR,Amazon,Home & Kitchen,20.19,39.88,15,4.89,4,5.6,228,FALSE,FALSE,382.85,180,267.99,125.71\r
STRESS-0386,"Sports & Outdoors Product 386",IT,WooCommerce,Sports & Outdoors,46.4,83.96,13,4.6,12,4.2,414,TRUE,TRUE,2418.05,540,1269.48,694.51\r
STRESS-0387,"Beauty & Health Product 387",ES,Shopify,Beauty & Health,46.19,91.97,13,3.89,20,4,339,FALSE,FALSE,4414.56,900,2207.28,1253.64\r
STRESS-0388,"Apparel Product 388",DE,Amazon,Apparel,49.17,96.83,15,4.6,23,2.4,265,TRUE,TRUE,5345.02,1035,1603.5,1508.75\r
STRESS-0389,"Pet Supplies Product 389",FR,WooCommerce,Pet Supplies,36.27,77.96,15,3.31,20,3.1,64,TRUE,TRUE,3742.08,900,1450.06,1085.52\r
STRESS-0390,"Electronics Product 390",IT,Shopify,Electronics,51.95,93.46,12,4.1,12,2.9,496,FALSE,FALSE,2691.65,540,975.72,762.91\r
STRESS-0391,"Home & Kitchen Product 391",ES,Amazon,Home & Kitchen,33.49,66.41,14,5.36,20,4.6,423,FALSE,TRUE,3187.68,900,1832.92,946.92\r
STRESS-0392,"Sports & Outdoors Product 392",DE,WooCommerce,Sports & Outdoors,41.91,85.1,12,38.3,23,4.4,257,TRUE,TRUE,4697.52,1035,2583.64,1346.88\r
STRESS-0393,"Beauty & Health Product 393",FR,Shopify,Beauty & Health,13.85,24.17,15,4.38,11,5.2,176,TRUE,TRUE,638.09,495,414.76,242.02\r
STRESS-0394,"Apparel Product 394",IT,Amazon,Apparel,31.03,78.45,15,3.87,13,2.7,153,TRUE,FALSE,2447.64,585,826.08,709.41\r
STRESS-0395,"Pet Supplies Product 395",ES,WooCommerce,Pet Supplies,29.57,57.75,14,5.86,21,6.9,447,TRUE,TRUE,2910.6,945,2510.39,885.15\r
STRESS-0396,"Electronics Product 396",DE,Shopify,Electronics,20.37,53.91,15,2.98,2,4,147,TRUE,FALSE,258.77,90,129.38,79.69\r
STRESS-0397,"Home & Kitchen Product 397",FR,Amazon,Home & Kitchen,41.3,70.78,12,5.51,2,3.4,430,TRUE,TRUE,339.74,90,144.39,99.94\r
STRESS-0398,"Sports & Outdoors Product 398",IT,WooCommerce,Sports & Outdoors,7.33,16.57,13,2.83,5,4,450,TRUE,FALSE,198.84,225,99.42,87.21\r
STRESS-0399,"Beauty & Health Product 399",ES,Shopify,Beauty & Health,28.91,68.56,15,4.8,2,6.9,260,TRUE,TRUE,329.09,90,283.84,97.27\r
STRESS-0400,"Apparel Product 400",DE,Amazon,Apparel,59.43,55.03,14,5.81,20,3,267,FALSE,FALSE,2641.44,900,990.54,810.36\r
STRESS-0401,"Pet Supplies Product 401",FR,WooCommerce,Pet Supplies,13.9,36.99,14,5.02,15,5.2,77,TRUE,FALSE,1331.64,675,865.57,445.41\r
STRESS-0402,"Electronics Product 402",IT,Shopify,Electronics,16.56,33.28,15,3.3,23,2.8,77,TRUE,TRUE,1837.06,1035,642.97,631.76\r
STRESS-0403,"Home & Kitchen Product 403",ES,Amazon,Home & Kitchen,15.89,28.85,14,5.46,4,6.5,199,TRUE,TRUE,276.96,180,225.03,99.24\r
STRESS-0404,"Sports & Outdoors Product 404",DE,WooCommerce,Sports & Outdoors,18.62,47.66,13,2.53,24,4.7,416,TRUE,TRUE,2745.22,1080,1612.81,866.3\r
STRESS-0405,"Beauty & Health Product 405",FR,Shopify,Beauty & Health,39.36,94.77,14,2.72,12,4.8,139,TRUE,TRUE,2729.38,540,1637.63,772.34\r
STRESS-0406,"Apparel Product 406",IT,Amazon,Apparel,28.53,54.83,12,2.58,6,5.5,489,TRUE,TRUE,789.55,270,542.82,242.39\r
STRESS-0407,"Pet Supplies Product 407",ES,WooCommerce,Pet Supplies,21.13,43.23,12,2.63,23,6.7,166,TRUE,FALSE,2386.3,1035,1998.52,769.07\r
STRESS-0408,"Electronics Product 408",DE,Shopify,Electronics,50.16,88.73,14,4.68,16,22.5,321,TRUE,TRUE,3407.23,720,10647.6,971.81\r
STRESS-0409,"Home & Kitchen Product 409",FR,Amazon,Home & Kitchen,14.04,27.77,13,4.83,6,5.2,387,TRUE,FALSE,399.89,270,259.93,144.97\r
STRESS-0410,"Sports & Outdoors Product 410",IT,WooCommerce,Sports & Outdoors,42.53,83.35,13,4.86,20,7,336,TRUE,FALSE,4000.8,900,3500.7,1150.2\r
STRESS-0411,"Beauty & Health Product 411",ES,Shopify,Beauty & Health,45.48,99.03,15,3.36,15,6.2,80,TRUE,FALSE,3565.08,675,2762.94,1003.77\r
STRESS-0412,"Apparel Product 412",DE,Amazon,Apparel,25.05,51.55,12,5.86,16,3.1,441,TRUE,TRUE,1979.52,720,767.06,614.88\r
STRESS-0413,"Pet Supplies Product 413",FR,WooCommerce,Pet Supplies,35.2,74.16,12,4.08,9,4.4,263,FALSE,TRUE,1601.86,405,881.02,467.96\r
STRESS-0414,"Electronics Product 414",IT,Shopify,Electronics,44.36,80.48,13,3.09,7,2.1,93,FALSE,FALSE,1352.06,315,354.92,390.52\r
STRESS-0415,"Home & Kitchen Product 415",ES,Amazon,Home & Kitchen,16.1,43.99,15,3,1,5.5,109,TRUE,FALSE,105.58,45,72.58,33.89\r
STRESS-0416,"Sports & Outdoors Product 416",DE,WooCommerce,Sports & Outdoors,31.57,79.85,15,2.94,18,5.5,239,FALSE,TRUE,28027.35,810,2371.55,997.38\r
STRESS-0417,"Beauty & Health Product 417",FR,Shopify,Beauty & Health,25.39,50.31,12,4.98,8,6.6,142,TRUE,TRUE,965.95,360,796.91,301.49\r
STRESS-0418,"Apparel Product 418",IT,Amazon,Apparel,47.97,82.51,13,3.98,10,3.5,118,FALSE,FALSE,1980.24,450,866.36,570.06\r
STRESS-0419,"Pet Supplies Product 419",ES,WooCommerce,Pet Supplies,35.67,68.86,14,4.52,14,6.7,491,TRUE,FALSE,2313.7,630,1937.72,683.42\r
STRESS-0420,"Electronics Product 420",DE,Shopify,Electronics,14.69,31.01,12,4.67,19,6.5,143,TRUE,TRUE,1414.06,855,1148.92,496.01\r
STRESS-0421,"Home & Kitchen Product 421",FR,Amazon,Home & Kitchen,6.81,18.41,13,3.93,8,6,358,TRUE,FALSE,353.47,360,265.1,148.37\r
STRESS-0422,"Sports & Outdoors Product 422",IT,WooCommerce,Sports & Outdoors,44.81,86.23,12,5.68,21,5.7,193,TRUE,TRUE,4345.99,945,3096.52,1244\r
STRESS-0423,"Beauty & Health Product 423",ES,Shopify,Beauty & Health,46.73,80.98,15,5.03,9,3.2,473,TRUE,TRUE,1749.17,405,699.67,504.79\r
STRESS-0424,"Apparel Product 424",DE,Amazon,Apparel,33.21,93.01,15,41.85,7,4.5,475,TRUE,TRUE,1562.57,315,878.94,443.14\r
STRESS-0425,"Pet Supplies Product 425",FR,WooCommerce,Pet Supplies,36.98,87.68,13,2.66,17,4.1,477,TRUE,FALSE,3577.34,765,1833.39,1021.84\r
STRESS-0426,"Electronics Product 426",IT,Shopify,Electronics,13.46,30.72,13,2.82,8,3.1,213,TRUE,FALSE,589.82,360,228.56,207.46\r
STRESS-0427,"Home & Kitchen Product 427",ES,Amazon,Home & Kitchen,18.86,31.62,14,4.21,21,5.2,454,TRUE,TRUE,1593.65,945,1035.87,555.91\r
STRESS-0428,"Sports & Outdoors Product 428",DE,WooCommerce,Sports & Outdoors,10.9,21.26,12,5.99,2,2.5,201,TRUE,FALSE,102.05,90,31.89,40.51\r
STRESS-0429,"Beauty & Health Product 429",FR,Shopify,Beauty & Health,9.02,19.69,15,5.08,16,6.8,66,FALSE,FALSE,756.1,720,642.68,309.02\r
STRESS-0430,"Apparel Product 430",IT,Amazon,Apparel,27.88,51.95,15,3.91,6,6.2,409,TRUE,FALSE,748.08,270,579.76,232.02\r
STRESS-0431,"Pet Supplies Product 431",ES,WooCommerce,Pet Supplies,29.13,50.74,14,5.97,25,3.5,333,TRUE,TRUE,3044.4,1125,1331.93,948.6\r
STRESS-0432,"Electronics Product 432",DE,Shopify,Electronics,27.32,72.47,12,5.39,23,22.5,262,TRUE,TRUE,4000.34,1035,12501.07,1172.59\r
STRESS-0433,"Home & Kitchen Product 433",FR,Amazon,Home & Kitchen,41.9,94.84,15,4.37,15,4.7,53,TRUE,TRUE,3414.24,675,2005.87,966.06\r
STRESS-0434,"Sports & Outdoors Product 434",IT,WooCommerce,Sports & Outdoors,8.62,17.79,12,4.48,23,6,88,TRUE,TRUE,982.01,1035,736.51,418\r
STRESS-0435,"Beauty & Health Product 435",ES,Shopify,Beauty & Health,14.95,29.44,14,3.07,15,5,176,TRUE,TRUE,1059.84,675,662.4,377.46\r
STRESS-0436,"Apparel Product 436",DE,Amazon,Apparel,9.2,19.23,13,2.58,11,2.3,152,TRUE,TRUE,507.67,495,145.96,209.42\r
STRESS-0437,"Pet Supplies Product 437",FR,WooCommerce,Pet Supplies,25,43.22,13,2.85,24,5,310,FALSE,FALSE,2489.47,1080,1555.92,802.37\r
STRESS-0438,"Electronics Product 438",IT,Shopify,Electronics,47.22,92.92,12,4.11,4,2.3,249,TRUE,FALSE,892.03,180,256.46,253.01\r
STRESS-0439,"Home & Kitchen Product 439",ES,Amazon,Home & Kitchen,48.74,96.23,13,5.46,18,4.1,478,TRUE,FALSE,4157.14,810,2130.53,1174.28\r
STRESS-0440,"Sports & Outdoors Product 440",DE,WooCommerce,Sports & Outdoors,26.21,44.82,15,20.17,20,3.7,391,TRUE,TRUE,2151.36,900,995,687.84\r
STRESS-0441,"Beauty & Health Product 441",FR,Shopify,Beauty & Health,53.16,89.16,12,3.54,12,6.8,431,TRUE,FALSE,2567.81,540,2182.64,731.95\r
STRESS-0442,"Apparel Product 442",IT,Amazon,Apparel,9.85,23.66,15,5.66,5,4.6,287,TRUE,TRUE,283.92,225,163.25,108.48\r
STRESS-0443,"Pet Supplies Product 443",ES,WooCommerce,Pet Supplies,31.04,54.83,12,5.76,12,3.2,259,TRUE,TRUE,1579.1,540,631.64,484.78\r
STRESS-0444,"Electronics Product 444",DE,Shopify,Electronics,13.86,29.56,12,3.09,17,2.1,228,TRUE,FALSE,1206.05,765,316.59,429.01\r
STRESS-0445,"Home & Kitchen Product 445",FR,Amazon,Home & Kitchen,7.39,20.4,14,3.49,17,4.3,458,TRUE,FALSE,832.32,765,447.37,335.58\r
STRESS-0446,"Sports & Outdoors Product 446",IT,WooCommerce,Sports & Outdoors,22.56,39.67,12,5.91,9,3,224,TRUE,TRUE,856.87,405,321.33,281.72\r
STRESS-0447,"Beauty & Health Product 447",ES,Shopify,Beauty & Health,16.45,37.29,13,3.83,24,5.6,389,TRUE,FALSE,2147.9,1080,1503.53,716.98\r
STRESS-0448,"Apparel Product 448",DE,Amazon,Apparel,22.99,50.73,12,5.01,19,3.9,288,TRUE,TRUE,18795.47,855,1127.73,720.82\r
STRESS-0449,"Pet Supplies Product 449",FR,WooCommerce,Pet Supplies,18.51,33.64,14,3.01,6,2.7,208,TRUE,TRUE,484.42,270,163.49,166.1\r
STRESS-0450,"Electronics Product 450",IT,Shopify,Electronics,51.08,85.23,12,5.31,23,6,239,TRUE,TRUE,4704.7,1035,3528.52,1348.67\r
STRESS-0451,"Home & Kitchen Product 451",ES,Amazon,Home & Kitchen,34.26,57.48,13,3.22,16,3.7,267,TRUE,FALSE,2207.23,720,1020.84,671.81\r
STRESS-0452,"Sports & Outdoors Product 452",DE,WooCommerce,Sports & Outdoors,43.25,94.65,12,2.88,14,3.1,191,TRUE,TRUE,3180.24,630,1232.34,900.06\r
STRESS-0453,"Beauty & Health Product 453",FR,Shopify,Beauty & Health,27.9,74.75,12,3.4,2,5.2,469,TRUE,TRUE,358.8,90,233.22,104.7\r
STRESS-0454,"Apparel Product 454",IT,Amazon,Apparel,34.14,64.3,14,5.76,11,4.3,178,TRUE,FALSE,1697.52,495,912.42,506.88\r
STRESS-0455,"Pet Supplies Product 455",ES,WooCommerce,Pet Supplies,43.73,81.32,12,5.07,15,4.1,417,TRUE,TRUE,2927.52,675,1500.35,844.38\r
STRESS-0456,"Electronics Product 456",DE,Shopify,Electronics,35.32,60.8,14,3.96,9,22.5,172,TRUE,FALSE,1313.28,405,4104,395.82\r
STRESS-0457,"Home & Kitchen Product 457",FR,Amazon,Home & Kitchen,10.83,23.11,12,5.25,10,6.1,448,TRUE,TRUE,554.64,450,422.91,213.66\r
STRESS-0458,"Sports & Outdoors Product 458",IT,WooCommerce,Sports & Outdoors,30.08,64.77,14,4.78,23,5.3,483,TRUE,TRUE,3575.3,1035,2368.64,1066.33\r
STRESS-0459,"Beauty & Health Product 459",ES,Shopify,Beauty & Health,16.39,41.35,15,5.06,24,2.6,248,TRUE,FALSE,2381.76,1080,774.07,775.44\r
STRESS-0460,"Apparel Product 460",DE,Amazon,Apparel,31.03,53.75,14,4.15,3,3.3,101,TRUE,TRUE,387,135,159.64,119.25\r
STRESS-0461,"Pet Supplies Product 461",FR,WooCommerce,Pet Supplies,17.63,30.7,13,2.78,11,2.5,369,TRUE,TRUE,810.48,495,253.28,285.12\r
STRESS-0462,"Electronics Product 462",IT,Shopify,Electronics,20.58,58.46,12,5.91,15,5.7,239,TRUE,TRUE,2104.56,675,1499.5,638.64\r
STRESS-0463,"Home & Kitchen Product 463",ES,Amazon,Home & Kitchen,40.07,94.33,15,3.32,2,4.1,172,FALSE,FALSE,452.78,90,232.05,128.2\r
STRESS-0464,"Sports & Outdoors Product 464",DE,WooCommerce,Sports & Outdoors,49.09,45.45,13,5.32,12,2.6,212,TRUE,FALSE,1308.96,540,425.41,417.24\r
STRESS-0465,"Beauty & Health Product 465",FR,Shopify,Beauty & Health,42.76,93.06,15,5.59,13,6.9,224,TRUE,TRUE,2903.47,585,2504.24,823.37\r
STRESS-0466,"Apparel Product 466",IT,Amazon,Apparel,16.72,39.91,14,2.85,25,3.4,315,TRUE,TRUE,2394.6,1125,1017.7,786.15\r
STRESS-0467,"Pet Supplies Product 467",ES,WooCommerce,Pet Supplies,33.49,82.15,13,2.97,7,4.2,255,TRUE,TRUE,1380.12,315,724.56,397.53\r
STRESS-0468,"Electronics Product 468",DE,Shopify,Electronics,28.53,51.15,12,4.69,7,2.3,324,TRUE,FALSE,859.32,315,247.05,267.33\r
STRESS-0469,"Home & Kitchen Product 469",FR,Amazon,Home & Kitchen,28.02,75.11,12,4.53,15,4.5,199,FALSE,FALSE,2703.96,675,1520.98,788.49\r
STRESS-0470,"Sports & Outdoors Product 470",IT,WooCommerce,Sports & Outdoors,21.02,57.87,15,4.36,21,3.2,324,TRUE,FALSE,2916.65,945,1166.66,886.66\r
STRESS-0471,"Beauty & Health Product 471",ES,Shopify,Beauty & Health,35.75,67.22,15,5.55,7,3.8,305,TRUE,TRUE,1129.3,315,536.42,334.82\r
STRESS-0472,"Apparel Product 472",DE,Amazon,Apparel,16.15,28.88,12,13,22,2.4,269,TRUE,TRUE,1524.86,990,457.46,546.22\r
STRESS-0473,"Pet Supplies Product 473",FR,WooCommerce,Pet Supplies,45.61,76.43,13,5.68,7,2.2,302,TRUE,TRUE,1284.02,315,353.11,373.51\r
STRESS-0474,"Electronics Product 474",IT,Shopify,Electronics,21,40.16,15,3.34,23,6.6,289,TRUE,FALSE,2216.83,1035,1828.89,726.71\r
STRESS-0475,"Home & Kitchen Product 475",ES,Amazon,Home & Kitchen,55.1,95.03,13,5.28,19,5.3,119,TRUE,FALSE,4333.37,855,2870.86,1225.84\r
STRESS-0476,"Sports & Outdoors Product 476",DE,WooCommerce,Sports & Outdoors,50.43,93.42,14,4.42,22,4.6,343,TRUE,TRUE,4932.58,990,2836.23,1398.14\r
STRESS-0477,"Beauty & Health Product 477",FR,Shopify,Beauty & Health,10.74,21.69,13,5.56,2,3.6,447,TRUE,TRUE,104.11,90,46.85,41.03\r
STRESS-0478,"Apparel Product 478",IT,Amazon,Apparel,50.91,98.32,12,4.26,8,6.5,474,TRUE,FALSE,1887.74,360,1533.79,531.94\r
STRESS-0479,"Pet Supplies Product 479",ES,WooCommerce,Pet Supplies,28.84,77.53,15,2.68,14,6,498,TRUE,TRUE,2605.01,630,1953.76,756.25\r
STRESS-0480,"Electronics Product 480",DE,Shopify,Electronics,20.54,42.08,13,2.56,15,5.3,232,TRUE,TRUE,12308.4,675,1003.61,491.22\r
STRESS-0481,"Home & Kitchen Product 481",FR,Amazon,Home & Kitchen,9.41,18.11,12,5.27,8,4.7,92,TRUE,TRUE,347.71,360,204.28,146.93\r
STRESS-0482,"Sports & Outdoors Product 482",IT,WooCommerce,Sports & Outdoors,27.96,65.02,13,3.59,18,4.8,145,TRUE,FALSE,2808.86,810,1685.32,837.22\r
STRESS-0483,"Beauty & Health Product 483",ES,Shopify,Beauty & Health,14.6,32.69,12,2.6,3,3.5,385,TRUE,TRUE,235.37,135,102.97,81.34\r
STRESS-0484,"Apparel Product 484",DE,Amazon,Apparel,8.49,15.71,12,5.12,20,5.2,390,FALSE,TRUE,754.08,900,490.15,338.52\r
STRESS-0485,"Pet Supplies Product 485",FR,WooCommerce,Pet Supplies,29.74,68.2,12,4.88,18,3.9,256,TRUE,TRUE,2946.24,810,1436.29,871.56\r
STRESS-0486,"Electronics Product 486",IT,Shopify,Electronics,39.55,98.37,13,4.26,8,6.6,191,TRUE,FALSE,1888.7,360,1558.18,532.18\r
STRESS-0487,"Home & Kitchen Product 487",ES,Amazon,Home & Kitchen,45.66,86.29,13,5,2,6.8,412,TRUE,TRUE,414.19,90,352.06,118.55\r
STRESS-0488,"Sports & Outdoors Product 488",DE,WooCommerce,Sports & Outdoors,22.76,59.9,14,26.95,2,6.8,494,TRUE,TRUE,287.52,90,244.39,86.88\r
STRESS-0489,"Beauty & Health Product 489",FR,Shopify,Beauty & Health,15.25,42.31,14,3.99,4,6.3,489,TRUE,TRUE,406.18,180,319.86,131.54\r
STRESS-0490,"Apparel Product 490",IT,Amazon,Apparel,25.97,43.59,15,5.95,13,6,245,TRUE,TRUE,1360.01,585,1020.01,437.5\r
STRESS-0491,"Pet Supplies Product 491",ES,WooCommerce,Pet Supplies,35.56,88.71,15,4.51,4,4.8,337,TRUE,TRUE,851.62,180,510.97,242.9\r
STRESS-0492,"Electronics Product 492",DE,Shopify,Electronics,14.98,27.09,15,3.36,17,2.4,88,TRUE,TRUE,1105.27,765,331.58,403.82\r
STRESS-0493,"Home & Kitchen Product 493",FR,Amazon,Home & Kitchen,35.1,71.46,13,4.13,1,4.8,158,TRUE,FALSE,171.5,45,102.9,50.38\r
STRESS-0494,"Sports & Outdoors Product 494",IT,WooCommerce,Sports & Outdoors,12.07,23.48,13,4.95,2,4.7,404,TRUE,FALSE,112.7,90,66.21,43.18\r
STRESS-0495,"Beauty & Health Product 495",ES,Shopify,Beauty & Health,48.07,80.39,12,4.98,23,4.2,427,TRUE,FALSE,4437.53,1035,2329.7,1281.88\r
STRESS-0496,"Apparel Product 496",DE,Amazon,Apparel,99.59,92.21,12,5.09,7,2.4,317,TRUE,FALSE,1549.13,315,464.74,439.78\r
STRESS-0497,"Pet Supplies Product 497",FR,WooCommerce,Pet Supplies,49.12,97.73,12,5.74,6,4.6,429,FALSE,TRUE,1407.31,270,809.2,396.83\r
STRESS-0498,"Electronics Product 498",IT,Shopify,Electronics,38.02,75.85,15,3.3,12,6.2,229,TRUE,TRUE,2184.48,540,1692.97,636.12\r
STRESS-0499,"Home & Kitchen Product 499",ES,Amazon,Home & Kitchen,23.81,56.25,15,3.96,4,5.4,339,TRUE,TRUE,540,180,364.5,165\r
STRESS-0500,"Sports & Outdoors Product 500",DE,WooCommerce,Sports & Outdoors,27.08,50,15,4.71,16,4.9,371,TRUE,TRUE,1920,720,1176,600\r
STRESS-0501,"Beauty & Health Product 501",FR,Shopify,Beauty & Health,21.84,60.13,14,3.84,22,6.8,341,FALSE,TRUE,3174.86,990,2698.63,958.72\r
STRESS-0502,"Apparel Product 502",IT,Amazon,Apparel,42.71,76.81,15,3.09,12,5.1,387,TRUE,FALSE,2212.13,540,1410.23,643.03\r
STRESS-0503,"Pet Supplies Product 503",ES,WooCommerce,Pet Supplies,28.9,50.11,15,4.29,5,5.6,396,TRUE,TRUE,601.32,225,420.92,187.83\r
STRESS-0504,"Electronics Product 504",DE,Shopify,Electronics,50.44,89.11,14,3.32,3,22.5,388,TRUE,FALSE,641.59,135,2004.97,182.9\r
STRESS-0505,"Home & Kitchen Product 505",FR,Amazon,Home & Kitchen,37.45,90.54,12,5.17,4,5,235,TRUE,FALSE,869.18,180,543.24,247.3\r
STRESS-0506,"Sports & Outdoors Product 506",IT,WooCommerce,Sports & Outdoors,7.98,20.43,14,4.89,23,4.2,286,TRUE,TRUE,1127.74,1035,592.06,454.43\r
STRESS-0507,"Beauty & Health Product 507",ES,Shopify,Beauty & Health,26.78,52.03,15,5.61,14,2,369,TRUE,TRUE,1748.21,630,437.05,542.05\r
STRESS-0508,"Apparel Product 508",DE,Amazon,Apparel,36.51,63.72,14,3.1,17,5.4,147,TRUE,TRUE,2599.78,765,1754.85,777.44\r
STRESS-0509,"Pet Supplies Product 509",FR,WooCommerce,Pet Supplies,18.19,30.4,14,2.62,1,2.9,291,FALSE,TRUE,72.96,45,26.45,25.74\r
STRESS-0510,"Electronics Product 510",IT,Shopify,Electronics,32.93,66.49,13,5.43,12,4.4,454,FALSE,FALSE,1914.91,540,1053.2,568.73\r
STRESS-0511,"Home & Kitchen Product 511",ES,Amazon,Home & Kitchen,26.47,57.05,15,3.43,18,4.1,444,FALSE,FALSE,2464.56,810,1263.09,751.14\r
STRESS-0512,"Sports & Outdoors Product 512",DE,WooCommerce,Sports & Outdoors,36.57,85.16,14,3.88,14,6.8,120,TRUE,FALSE,23248.68,630,2432.17,820.34\r
STRESS-0513,"Beauty & Health Product 513",FR,Shopify,Beauty & Health,36.35,65.14,14,4.81,14,4.8,482,TRUE,TRUE,2188.7,630,1313.22,652.18\r
STRESS-0514,"Apparel Product 514",IT,Amazon,Apparel,23.1,43.93,13,4.81,6,6.5,84,TRUE,FALSE,632.59,270,513.98,203.15\r
STRESS-0515,"Pet Supplies Product 515",ES,WooCommerce,Pet Supplies,32.38,55.67,15,2.89,10,2.2,162,TRUE,FALSE,1336.08,450,367.42,409.02\r
STRESS-0516,"Electronics Product 516",DE,Shopify,Electronics,54.34,91.91,14,5.93,24,2.6,307,TRUE,TRUE,5294.02,1080,1720.56,1503.5\r
STRESS-0517,"Home & Kitchen Product 517",FR,Amazon,Home & Kitchen,15.6,44.43,13,2.64,23,3,257,FALSE,FALSE,2452.54,1035,919.7,785.63\r
STRESS-0518,"Sports & Outdoors Product 518",IT,WooCommerce,Sports & Outdoors,28.82,74.52,12,6,10,5.7,62,TRUE,TRUE,1788.48,450,1274.29,522.12\r
STRESS-0519,"Beauty & Health Product 519",ES,Shopify,Beauty & Health,29.15,52.31,13,2.87,25,4,226,TRUE,TRUE,3138.6,1125,1569.3,972.15\r
STRESS-0520,"Apparel Product 520",DE,Amazon,Apparel,41.32,72.77,14,32.75,16,6.4,485,TRUE,FALSE,2794.37,720,2235.49,818.59\r
STRESS-0521,"Pet Supplies Product 521",FR,WooCommerce,Pet Supplies,36.07,92.83,12,3.66,18,4.1,445,TRUE,TRUE,4010.26,810,2055.26,1137.56\r
STRESS-0522,"Electronics Product 522",IT,Shopify,Electronics,42.04,91.83,13,4.81,16,3.4,331,TRUE,FALSE,3526.27,720,1498.67,1001.57\r
STRESS-0523,"Home & Kitchen Product 523",ES,Amazon,Home & Kitchen,25.84,49.27,12,5.07,4,2.5,55,TRUE,TRUE,472.99,180,147.81,148.25\r
STRESS-0524,"Sports & Outdoors Product 524",DE,WooCommerce,Sports & Outdoors,51.95,89.26,13,3.43,21,5.7,218,TRUE,TRUE,4498.7,945,3205.33,1282.18\r
STRESS-0525,"Beauty & Health Product 525",FR,Shopify,Beauty & Health,17.37,36.55,12,4.02,7,3.2,59,TRUE,TRUE,614.04,315,245.62,206.01\r
STRESS-0526,"Apparel Product 526",IT,Amazon,Apparel,21.95,47.24,15,3.77,24,2.7,336,TRUE,FALSE,2721.02,1080,918.35,860.26\r
STRESS-0527,"Pet Supplies Product 527",ES,WooCommerce,Pet Supplies,18.27,40.07,14,5.31,1,5.4,236,TRUE,FALSE,96.17,45,64.91,31.54\r
STRESS-0528,"Electronics Product 528",DE,Shopify,Electronics,17.41,29.53,12,6,21,22.5,246,TRUE,TRUE,1488.31,945,4650.98,529.58\r
STRESS-0529,"Home & Kitchen Product 529",FR,Amazon,Home & Kitchen,15.8,38.14,14,2.56,10,2.4,178,TRUE,TRUE,915.36,450,274.61,303.84\r
STRESS-0530,"Sports & Outdoors Product 530",IT,WooCommerce,Sports & Outdoors,37,66,13,4.18,11,4.5,181,TRUE,FALSE,1742.4,495,980.1,518.1\r
STRESS-0531,"Beauty & Health Product 531",ES,Shopify,Beauty & Health,40.91,77.34,13,5.98,11,6.7,286,TRUE,FALSE,2041.78,495,1709.99,592.94\r
STRESS-0532,"Apparel Product 532",DE,Amazon,Apparel,25.35,67.14,12,4.65,20,2.4,213,TRUE,FALSE,3222.72,900,966.82,955.68\r
STRESS-0533,"Pet Supplies Product 533",FR,WooCommerce,Pet Supplies,41.15,92.42,15,5.46,2,3,157,TRUE,FALSE,443.62,90,166.36,125.9\r
STRESS-0534,"Electronics Product 534",IT,Shopify,Electronics,45.99,92.26,15,4.89,10,4.6,202,FALSE,FALSE,2214.24,450,1273.19,628.56\r
STRESS-0535,"Home & Kitchen Product 535",ES,Amazon,Home & Kitchen,39.44,76.37,15,5.12,18,2.9,215,TRUE,FALSE,3299.18,810,1195.95,959.8\r
STRESS-0536,"Sports & Outdoors Product 536",DE,WooCommerce,Sports & Outdoors,52.82,99.71,14,44.87,4,4.9,428,FALSE,FALSE,957.22,180,586.29,269.3\r
STRESS-0537,"Beauty & Health Product 537",FR,Shopify,Beauty & Health,31.77,53.13,12,5.43,15,2.8,360,TRUE,TRUE,1912.68,675,669.44,590.67\r
STRESS-0538,"Apparel Product 538",IT,Amazon,Apparel,16.75,28.69,14,5.5,15,4.9,425,TRUE,TRUE,1032.84,675,632.61,370.71\r
STRESS-0539,"Pet Supplies Product 539",ES,WooCommerce,Pet Supplies,32.01,57.09,14,2.82,16,2.6,93,TRUE,TRUE,2192.26,720,712.48,668.06\r
STRESS-0540,"Electronics Product 540",DE,Shopify,Electronics,11.76,33.29,15,3.76,4,3.7,161,TRUE,TRUE,319.58,180,147.81,109.9\r
STRESS-0541,"Home & Kitchen Product 541",FR,Amazon,Home & Kitchen,34.02,95.85,12,4.34,9,3.4,57,TRUE,FALSE,2070.36,405,879.9,585.09\r
STRESS-0542,"Sports & Outdoors Product 542",IT,WooCommerce,Sports & Outdoors,15.34,37.09,15,5.86,18,6.6,92,TRUE,TRUE,1602.29,810,1321.89,535.57\r
STRESS-0543,"Beauty & Health Product 543",ES,Shopify,Beauty & Health,9.35,18.28,12,3.23,6,3.3,70,TRUE,FALSE,263.23,270,108.58,110.81\r
STRESS-0544,"Apparel Product 544",DE,Amazon,Apparel,34.28,79.76,13,5.05,22,6.4,370,TRUE,FALSE,34217.04,990,3369.06,1217.83\r
STRESS-0545,"Pet Supplies Product 545",FR,WooCommerce,Pet Supplies,57.82,99.39,13,5.86,16,2.1,383,TRUE,TRUE,3816.58,720,1001.85,1074.14\r
STRESS-0546,"Electronics Product 546",IT,Shopify,Electronics,43.6,93.15,14,4.96,18,2.1,285,TRUE,TRUE,4024.08,810,1056.32,1141.02\r
STRESS-0547,"Home & Kitchen Product 547",ES,Amazon,Home & Kitchen,10.67,18.95,14,5.49,25,3.1,216,TRUE,FALSE,1137,1125,440.59,471.75\r
STRESS-0548,"Sports & Outdoors Product 548",DE,WooCommerce,Sports & Outdoors,43.96,85.73,15,2.56,12,2.3,443,TRUE,TRUE,2469.02,540,709.84,707.26\r
STRESS-0549,"Beauty & Health Product 549",FR,Shopify,Beauty & Health,9.14,18.53,15,3.02,4,6.7,347,TRUE,TRUE,177.89,180,148.98,74.47\r
STRESS-0550,"Apparel Product 550",IT,Amazon,Apparel,14.71,34.23,12,3.13,20,4.8,164,TRUE,TRUE,1643.04,900,985.82,560.76\r
STRESS-0551,"Pet Supplies Product 551",ES,WooCommerce,Pet Supplies,21.33,43.4,15,5.72,24,2.3,142,FALSE,TRUE,2499.84,1080,718.7,804.96\r
STRESS-0552,"Electronics Product 552",DE,Shopify,Electronics,43.26,77.88,13,4.09,9,22.5,235,FALSE,FALSE,1682.21,405,5256.9,488.05\r
STRESS-0553,"Home & Kitchen Product 553",FR,Amazon,Home & Kitchen,13.65,27.92,12,4.54,24,2.8,56,TRUE,TRUE,1608.19,1080,562.87,582.05\r
STRESS-0554,"Sports & Outdoors Product 554",IT,WooCommerce,Sports & Outdoors,36.82,85.78,13,5.56,24,2,428,TRUE,TRUE,4940.93,1080,1235.23,1415.23\r
STRESS-0555,"Beauty & Health Product 555",ES,Shopify,Beauty & Health,34.87,97.44,12,5.12,12,6.1,261,TRUE,TRUE,2806.27,540,2139.78,791.57\r
STRESS-0556,"Apparel Product 556",DE,Amazon,Apparel,30.57,65.5,15,5.11,1,3.4,354,FALSE,FALSE,157.2,45,66.81,46.8\r
STRESS-0557,"Pet Supplies Product 557",FR,WooCommerce,Pet Supplies,43.76,87.52,13,4.15,12,2.8,257,FALSE,FALSE,2520.58,540,882.2,720.14\r
STRESS-0558,"Electronics Product 558",IT,Shopify,Electronics,40.68,87.88,12,4.71,7,6.9,233,TRUE,FALSE,1476.38,315,1273.38,421.6\r
STRESS-0559,"Home & Kitchen Product 559",ES,Amazon,Home & Kitchen,41.7,69.58,12,5.99,3,5.4,374,FALSE,TRUE,500.98,135,338.16,147.74\r
STRESS-0560,"Sports & Outdoors Product 560",DE,WooCommerce,Sports & Outdoors,56.91,52.69,13,4.16,11,6.2,495,FALSE,FALSE,1391.02,495,1078.04,430.25\r
STRESS-0561,"Beauty & Health Product 561",FR,Shopify,Beauty & Health,26.06,46.78,14,5.02,5,6.1,449,FALSE,TRUE,561.36,225,428.04,177.84\r
STRESS-0562,"Apparel Product 562",IT,Amazon,Apparel,47.14,84.85,12,4.36,21,2,498,TRUE,TRUE,4276.44,945,1069.11,1226.61\r
STRESS-0563,"Pet Supplies Product 563",ES,WooCommerce,Pet Supplies,8.68,17.36,13,3.12,15,3.9,352,TRUE,TRUE,624.96,675,304.67,268.74\r
STRESS-0564,"Electronics Product 564",DE,Shopify,Electronics,23.97,43.67,12,5.71,22,3.9,256,TRUE,FALSE,2305.78,990,1124.07,741.44\r
STRESS-0565,"Home & Kitchen Product 565",FR,Amazon,Home & Kitchen,39.21,65.58,13,5.17,11,2.5,195,FALSE,FALSE,1731.31,495,541.03,515.33\r
STRESS-0566,"Sports & Outdoors Product 566",IT,WooCommerce,Sports & Outdoors,17.49,32.16,12,5.25,23,3.8,73,TRUE,TRUE,1775.23,1035,843.24,616.31\r
STRESS-0567,"Beauty & Health Product 567",ES,Shopify,Beauty & Health,17.69,30.03,13,2.98,11,2.7,187,TRUE,TRUE,792.79,495,267.57,280.7\r
STRESS-0568,"Apparel Product 568",DE,Amazon,Apparel,7.53,15.92,13,7.16,15,3,215,TRUE,FALSE,573.12,675,214.92,255.78\r
STRESS-0569,"Pet Supplies Product 569",FR,WooCommerce,Pet Supplies,27.74,46.56,13,5.3,9,2.3,251,TRUE,TRUE,1005.7,405,289.14,318.92\r
STRESS-0570,"Electronics Product 570",IT,Shopify,Electronics,21.4,50.79,13,2.63,19,2.7,158,TRUE,TRUE,2316.02,855,781.66,721.51\r
STRESS-0571,"Home & Kitchen Product 571",ES,Amazon,Home & Kitchen,17.68,30.28,14,2.87,17,6,351,FALSE,FALSE,1235.42,765,926.57,436.36\r
STRESS-0572,"Sports & Outdoors Product 572",DE,WooCommerce,Sports & Outdoors,15.69,27.28,15,5.02,17,3.1,266,TRUE,TRUE,1113.02,765,431.3,405.76\r
STRESS-0573,"Beauty & Health Product 573",FR,Shopify,Beauty & Health,9.83,24.31,15,2.73,8,6.4,269,TRUE,FALSE,466.75,360,373.4,176.69\r
STRESS-0574,"Apparel Product 574",IT,Amazon,Apparel,23.11,45.98,13,5.07,13,5.3,82,TRUE,FALSE,1434.58,585,950.41,456.14\r
STRESS-0575,"Pet Supplies Product 575",ES,WooCommerce,Pet Supplies,37.58,68.74,14,2.98,25,3,409,TRUE,TRUE,4124.4,1125,1546.65,1218.6\r
STRESS-0576,"Electronics Product 576",DE,Shopify,Electronics,17.9,49.16,14,3.95,8,2.9,426,TRUE,TRUE,7668.96,360,342.15,295.97\r
STRESS-0577,"Home & Kitchen Product 577",FR,Amazon,Home & Kitchen,41.34,78.69,12,2.85,22,2.2,271,TRUE,FALSE,4154.83,990,1142.58,1203.71\r
STRESS-0578,"Sports & Outdoors Product 578",IT,WooCommerce,Sports & Outdoors,36.44,78.02,12,4.02,8,5.9,51,TRUE,TRUE,1497.98,360,1104.76,434.5\r
STRESS-0579,"Beauty & Health Product 579",ES,Shopify,Beauty & Health,35.94,71.37,12,5.94,22,6.6,219,TRUE,FALSE,3768.34,990,3108.88,1107.08\r
STRESS-0580,"Apparel Product 580",DE,Amazon,Apparel,36.68,74.41,13,5.41,18,3.1,435,FALSE,TRUE,3214.51,810,1245.62,938.63\r
STRESS-0581,"Pet Supplies Product 581",FR,WooCommerce,Pet Supplies,34.24,60.1,13,3.46,21,6.6,178,TRUE,TRUE,3029.04,945,2498.96,914.76\r
STRESS-0582,"Electronics Product 582",IT,Shopify,Electronics,37.36,89.36,15,3.19,18,6.9,59,TRUE,TRUE,3860.35,810,3329.55,1100.09\r
STRESS-0583,"Home & Kitchen Product 583",ES,Amazon,Home & Kitchen,34.5,61.15,12,5.15,5,6.6,54,TRUE,FALSE,733.8,225,605.38,220.95\r
STRESS-0584,"Sports & Outdoors Product 584",DE,WooCommerce,Sports & Outdoors,17.49,49.72,15,22.37,21,4.8,434,TRUE,FALSE,2505.89,945,1503.53,783.97\r
STRESS-0585,"Beauty & Health Product 585",FR,Shopify,Beauty & Health,15.53,31.54,15,5.83,22,5.1,306,TRUE,TRUE,1665.31,990,1061.64,581.33\r
STRESS-0586,"Apparel Product 586",IT,Amazon,Apparel,30.84,78.37,14,4.14,19,2.6,429,TRUE,FALSE,3573.67,855,1161.44,1035.92\r
STRESS-0587,"Pet Supplies Product 587",ES,WooCommerce,Pet Supplies,11.04,26.47,15,5.97,9,5.7,191,TRUE,TRUE,571.75,405,407.37,210.44\r
STRESS-0588,"Electronics Product 588",DE,Shopify,Electronics,22.36,53.3,15,3.07,6,5.2,169,TRUE,TRUE,767.52,270,498.89,236.88\r
STRESS-0589,"Home & Kitchen Product 589",FR,Amazon,Home & Kitchen,28.72,57.87,13,2.58,8,3.9,490,TRUE,TRUE,1111.1,360,541.66,337.78\r
STRESS-0590,"Sports & Outdoors Product 590",IT,WooCommerce,Sports & Outdoors,27.08,46.41,13,2.74,11,2.2,160,FALSE,TRUE,1225.22,495,336.94,388.81\r
STRESS-0591,"Beauty & Health Product 591",ES,Shopify,Beauty & Health,27.64,75.22,12,5.45,19,2.7,105,TRUE,FALSE,3430.03,855,1157.64,1000.01\r
STRESS-0592,"Apparel Product 592",DE,Amazon,Apparel,59.94,55.5,14,4.49,24,5.1,129,TRUE,TRUE,3196.8,1080,2037.96,979.2\r
STRESS-0593,"Pet Supplies Product 593",FR,WooCommerce,Pet Supplies,19.35,34.34,14,5.28,14,3.5,90,FALSE,FALSE,1153.82,630,504.8,393.46\r
STRESS-0594,"Electronics Product 594",IT,Shopify,Electronics,49.33,86.07,14,3.19,12,6.5,140,TRUE,TRUE,2478.82,540,2014.04,709.7\r
STRESS-0595,"Home & Kitchen Product 595",ES,Amazon,Home & Kitchen,36.9,89.56,14,4.63,11,4.8,295,TRUE,FALSE,2364.38,495,1418.63,673.6\r
STRESS-0596,"Sports & Outdoors Product 596",DE,WooCommerce,Sports & Outdoors,37.54,65.48,12,4.77,24,5.3,494,FALSE,FALSE,3771.65,1080,2498.72,1122.91\r
STRESS-0597,"Beauty & Health Product 597",FR,Shopify,Beauty & Health,37.24,97.66,13,3.8,25,2.1,339,FALSE,TRUE,5859.6,1125,1538.15,1652.4\r
STRESS-0598,"Apparel Product 598",IT,Amazon,Apparel,31.53,64.8,13,4.5,14,4.6,399,TRUE,FALSE,2177.28,630,1251.94,649.32\r
STRESS-0599,"Pet Supplies Product 599",ES,WooCommerce,Pet Supplies,28.87,72.74,13,5.33,14,5.3,353,TRUE,TRUE,2444.06,630,1619.19,716.02\r
STRESS-0600,"Electronics Product 600",DE,Shopify,Electronics,22.7,43.98,12,3.89,10,22.5,177,TRUE,TRUE,1055.52,450,3298.5,338.88\r
STRESS-0601,"Home & Kitchen Product 601",FR,Amazon,Home & Kitchen,29.26,58.88,13,2.62,6,4.5,277,TRUE,TRUE,847.87,270,476.93,256.97\r
STRESS-0602,"Sports & Outdoors Product 602",IT,WooCommerce,Sports & Outdoors,37.72,79.23,13,2.98,9,2.7,492,FALSE,FALSE,1711.37,405,577.59,495.34\r
STRESS-0603,"Beauty & Health Product 603",ES,Shopify,Beauty & Health,7.7,20.51,15,4.14,2,6,128,TRUE,TRUE,98.45,90,73.84,39.61\r
STRESS-0604,"Apparel Product 604",DE,Amazon,Apparel,52.32,88.06,12,2.87,6,6.8,154,TRUE,TRUE,1268.06,270,1077.85,362.02\r
STRESS-0605,"Pet Supplies Product 605",FR,WooCommerce,Pet Supplies,34.97,59,15,3.62,14,3.8,108,TRUE,TRUE,1982.4,630,941.64,600.6\r
STRESS-0606,"Electronics Product 606",IT,Shopify,Electronics,40.05,71.85,14,5.72,23,5.2,83,TRUE,TRUE,3966.12,1035,2577.98,1164.03\r
STRESS-0607,"Home & Kitchen Product 607",ES,Amazon,Home & Kitchen,24.2,40.99,12,3.9,21,3.4,83,TRUE,TRUE,2065.9,945,878.01,673.97\r
STRESS-0608,"Sports & Outdoors Product 608",DE,WooCommerce,Sports & Outdoors,32.01,55.17,14,3.77,11,5.5,102,TRUE,TRUE,11833.97,495,1001.34,446.62\r
STRESS-0609,"Beauty & Health Product 609",FR,Shopify,Beauty & Health,46.92,79.08,13,4.94,5,2.3,293,TRUE,FALSE,948.96,225,272.83,274.74\r
STRESS-0610,"Apparel Product 610",IT,Amazon,Apparel,30.04,83,15,5.96,25,6.3,470,TRUE,FALSE,4980,1125,3921.75,1432.5\r
STRESS-0611,"Pet Supplies Product 611",ES,WooCommerce,Pet Supplies,13.09,23.09,15,4.43,4,5.5,239,TRUE,TRUE,221.66,180,152.39,85.42\r
STRESS-0612,"Electronics Product 612",DE,Shopify,Electronics,12.61,24.99,13,3.09,25,5.8,405,TRUE,FALSE,1499.4,1125,1087.06,562.35\r
STRESS-0613,"Home & Kitchen Product 613",FR,Amazon,Home & Kitchen,14.09,38.15,15,2.97,7,2.6,87,TRUE,TRUE,640.92,315,208.3,212.73\r
STRESS-0614,"Sports & Outdoors Product 614",IT,WooCommerce,Sports & Outdoors,35.28,82.16,13,4.57,8,5.5,304,TRUE,TRUE,1577.47,360,1084.51,454.37\r
STRESS-0615,"Beauty & Health Product 615",ES,Shopify,Beauty & Health,16.61,44.71,15,5.26,9,5.3,373,TRUE,TRUE,965.74,405,639.8,308.93\r
STRESS-0616,"Apparel Product 616",DE,Amazon,Apparel,24.65,43.78,14,19.7,22,5.2,118,FALSE,FALSE,2311.58,990,1502.53,742.9\r
STRESS-0617,"Pet Supplies Product 617",FR,WooCommerce,Pet Supplies,8.72,23.35,14,5.7,18,2.7,272,TRUE,TRUE,1008.72,810,340.44,387.18\r
STRESS-0618,"Electronics Product 618",IT,Shopify,Electronics,21.53,44.17,12,5.74,9,2.3,428,FALSE,FALSE,954.07,405,274.3,306.02\r
STRESS-0619,"Home & Kitchen Product 619",ES,Amazon,Home & Kitchen,38.8,98.41,12,4.81,20,6.2,155,TRUE,TRUE,4723.68,900,3660.85,1330.92\r
STRESS-0620,"Sports & Outdoors Product 620",DE,WooCommerce,Sports & Outdoors,46.42,82.44,14,3.44,20,5,497,TRUE,TRUE,3957.12,900,2473.2,1139.28\r
STRESS-0621,"Beauty & Health Product 621",FR,Shopify,Beauty & Health,16.88,48.04,13,4.18,22,2.3,57,TRUE,TRUE,2536.51,990,729.25,799.13\r
STRESS-0622,"Apparel Product 622",IT,Amazon,Apparel,10.18,21.75,12,2.96,14,6,497,TRUE,FALSE,730.8,630,548.1,287.7\r
STRESS-0623,"Pet Supplies Product 623",ES,WooCommerce,Pet Supplies,16.66,28.35,12,5.9,14,2.1,334,TRUE,FALSE,952.56,630,250.05,343.14\r
STRESS-0624,"Electronics Product 624",DE,Shopify,Electronics,31.77,55.27,12,3.19,1,22.5,388,TRUE,TRUE,132.65,45,414.53,40.66\r
STRESS-0625,"Home & Kitchen Product 625",FR,Amazon,Home & Kitchen,17.39,29.73,12,3.25,24,4,319,TRUE,TRUE,1712.45,1080,856.22,608.11\r
STRESS-0626,"Sports & Outdoors Product 626",IT,WooCommerce,Sports & Outdoors,41.97,72.43,14,4,23,4.6,293,FALSE,FALSE,3998.14,1035,2298.93,1172.03\r
STRESS-0627,"Beauty & Health Product 627",ES,Shopify,Beauty & Health,32.72,83.53,15,3.39,24,4.7,272,TRUE,FALSE,4811.33,1080,2826.66,1382.83\r
STRESS-0628,"Apparel Product 628",DE,Amazon,Apparel,11.71,23.22,12,4.89,3,4.8,53,TRUE,TRUE,167.18,135,100.31,64.3\r
STRESS-0629,"Pet Supplies Product 629",FR,WooCommerce,Pet Supplies,9.27,21.15,12,3.79,20,6.9,254,TRUE,TRUE,1015.2,900,875.61,403.8\r
STRESS-0630,"Electronics Product 630",IT,Shopify,Electronics,50.07,88.89,15,4.36,22,4.2,315,TRUE,FALSE,4693.39,990,2464.03,1338.35\r
STRESS-0631,"Home & Kitchen Product 631",ES,Amazon,Home & Kitchen,19.69,48.69,13,4.18,20,4.8,365,TRUE,FALSE,2337.12,900,1402.27,734.28\r
STRESS-0632,"Sports & Outdoors Product 632",DE,WooCommerce,Sports & Outdoors,17.38,46.14,15,20.76,17,5.6,434,TRUE,TRUE,1882.51,765,1317.76,598.13\r
STRESS-0633,"Beauty & Health Product 633",FR,Shopify,Beauty & Health,36.93,68.86,14,4.67,7,4.4,251,FALSE,TRUE,1156.85,315,636.27,341.71\r
STRESS-0634,"Apparel Product 634",IT,Amazon,Apparel,16.16,28.15,13,4.96,20,6.5,385,TRUE,TRUE,1351.2,900,1097.85,487.8\r
STRESS-0635,"Pet Supplies Product 635",ES,WooCommerce,Pet Supplies,14.32,35.49,15,4.41,25,6.1,388,TRUE,FALSE,2129.4,1125,1623.67,719.85\r
STRESS-0636,"Electronics Product 636",DE,Shopify,Electronics,8.62,20.28,14,4.77,2,2.3,226,TRUE,FALSE,97.34,90,27.99,39.34\r
STRESS-0637,"Home & Kitchen Product 637",FR,Amazon,Home & Kitchen,14.27,30.1,15,5.69,1,2.7,114,TRUE,TRUE,72.24,45,24.38,25.56\r
STRESS-0638,"Sports & Outdoors Product 638",IT,WooCommerce,Sports & Outdoors,16,36.34,13,3.08,13,3.8,72,TRUE,TRUE,1133.81,585,538.56,380.95\r
STRESS-0639,"Beauty & Health Product 639",ES,Shopify,Beauty & Health,35.23,87.71,13,3.95,18,6,250,TRUE,TRUE,3789.07,810,2841.8,1082.27\r
STRESS-0640,"Apparel Product 640",DE,Amazon,Apparel,11.21,28.13,13,2.5,11,4.5,488,TRUE,FALSE,6033.89,495,417.73,268.16\r
STRESS-0641,"Pet Supplies Product 641",FR,WooCommerce,Pet Supplies,20.31,39.83,14,4.51,4,6.3,263,TRUE,TRUE,382.37,180,301.11,125.59\r
STRESS-0642,"Electronics Product 642",IT,Shopify,Electronics,26.57,71.7,13,4.75,12,5.6,353,TRUE,FALSE,2064.96,540,1445.47,606.24\r
STRESS-0643,"Home & Kitchen Product 643",ES,Amazon,Home & Kitchen,12,25.62,15,5.79,6,4.8,299,TRUE,TRUE,368.93,270,221.36,137.23\r
STRESS-0644,"Sports & Outdoors Product 644",DE,WooCommerce,Sports & Outdoors,27.4,49.22,13,4.36,15,3.2,60,TRUE,TRUE,1771.92,675,708.77,555.48\r
STRESS-0645,"Beauty & Health Product 645",FR,Shopify,Beauty & Health,23.69,46.16,14,5.66,15,2.3,193,TRUE,TRUE,1661.76,675,477.76,527.94\r
STRESS-0646,"Apparel Product 646",IT,Amazon,Apparel,46.01,95.27,15,3.56,1,3.9,193,TRUE,FALSE,228.65,45,111.47,64.66\r
STRESS-0647,"Pet Supplies Product 647",ES,WooCommerce,Pet Supplies,15.2,40.83,12,5.18,18,5.4,218,TRUE,FALSE,1763.86,810,1190.6,575.96\r
STRESS-0648,"Electronics Product 648",DE,Shopify,Electronics,10.47,26.58,13,2.63,9,22.5,272,TRUE,FALSE,574.13,405,1794.15,211.03\r
STRESS-0649,"Home & Kitchen Product 649",FR,Amazon,Home & Kitchen,42.03,83.71,12,4.81,17,6.4,279,TRUE,TRUE,3415.37,765,2732.29,981.34\r
STRESS-0650,"Sports & Outdoors Product 650",IT,WooCommerce,Sports & Outdoors,17.37,49.38,13,3.8,17,4.5,274,FALSE,TRUE,2014.7,765,1133.27,631.18\r
STRESS-0651,"Beauty & Health Product 651",ES,Shopify,Beauty & Health,9.84,24.16,12,5.25,15,2.3,192,TRUE,TRUE,869.76,675,250.06,329.94\r
STRESS-0652,"Apparel Product 652",DE,Amazon,Apparel,12.87,29.94,12,2.74,13,6.6,183,TRUE,FALSE,934.13,585,770.66,331.03\r
STRESS-0653,"Pet Supplies Product 653",FR,WooCommerce,Pet Supplies,35.05,85.44,12,3.18,15,4.2,61,FALSE,TRUE,3075.84,675,1614.82,881.46\r
STRESS-0654,"Electronics Product 654",IT,Shopify,Electronics,31.97,55.71,14,3.07,7,3.1,141,TRUE,FALSE,935.93,315,362.67,286.48\r
STRESS-0655,"Home & Kitchen Product 655",ES,Amazon,Home & Kitchen,29,50.43,15,2.81,5,4.1,450,TRUE,TRUE,605.16,225,310.14,188.79\r
STRESS-0656,"Sports & Outdoors Product 656",DE,WooCommerce,Sports & Outdoors,24.67,22.84,12,5.3,2,6.8,182,TRUE,TRUE,109.63,90,93.19,42.41\r
STRESS-0657,"Beauty & Health Product 657",FR,Shopify,Beauty & Health,51.62,95.03,15,3.01,13,3.4,225,TRUE,TRUE,2964.94,585,1260.1,838.73\r
STRESS-0658,"Apparel Product 658",IT,Amazon,Apparel,40.22,95.88,15,3.65,17,6.5,322,TRUE,TRUE,3911.9,765,3178.42,1105.48\r
STRESS-0659,"Pet Supplies Product 659",ES,WooCommerce,Pet Supplies,16.56,45.17,15,3.94,11,5.8,393,TRUE,TRUE,1192.49,495,864.55,380.62\r
STRESS-0660,"Electronics Product 660",DE,Shopify,Electronics,16.05,37.3,14,4.82,8,2.4,345,TRUE,TRUE,716.16,360,214.85,239.04\r
STRESS-0661,"Home & Kitchen Product 661",FR,Amazon,Home & Kitchen,31.06,63,14,5.67,17,4.6,286,FALSE,TRUE,2570.4,765,1477.98,770.1\r
STRESS-0662,"Sports & Outdoors Product 662",IT,WooCommerce,Sports & Outdoors,33.16,73.51,14,4.39,11,4.6,404,TRUE,TRUE,1940.66,495,1115.88,567.67\r
STRESS-0663,"Beauty & Health Product 663",ES,Shopify,Beauty & Health,35.06,79.66,15,4.04,9,3.6,389,TRUE,TRUE,1720.66,405,774.3,497.66\r
STRESS-0664,"Apparel Product 664",DE,Amazon,Apparel,18.76,50.69,15,22.81,20,3.7,359,FALSE,TRUE,2433.12,900,1125.32,758.28\r
STRESS-0665,"Pet Supplies Product 665",FR,WooCommerce,Pet Supplies,27.27,45.96,12,3.68,14,6.3,331,TRUE,TRUE,1544.26,630,1216.1,491.06\r
STRESS-0666,"Electronics Product 666",IT,Shopify,Electronics,40.03,73.33,15,5.77,20,6.9,352,TRUE,FALSE,3519.84,900,3035.86,1029.96\r
STRESS-0667,"Home & Kitchen Product 667",ES,Amazon,Home & Kitchen,23.44,41.79,15,4.34,8,4.8,466,TRUE,TRUE,802.37,360,481.42,260.59\r
STRESS-0668,"Sports & Outdoors Product 668",DE,WooCommerce,Sports & Outdoors,34.97,70.86,15,5.1,2,6.7,244,TRUE,TRUE,340.13,90,284.86,100.03\r
STRESS-0669,"Beauty & Health Product 669",FR,Shopify,Beauty & Health,19.43,34.74,13,3.96,5,5.9,382,TRUE,TRUE,416.88,225,307.45,141.72\r
STRESS-0670,"Apparel Product 670",IT,Amazon,Apparel,34.18,58.92,13,2.53,13,6.2,342,TRUE,TRUE,1838.3,585,1424.69,557.08\r
STRESS-0671,"Pet Supplies Product 671",ES,WooCommerce,Pet Supplies,41.36,86.63,13,4.86,13,3.3,109,TRUE,TRUE,2702.86,585,1114.93,773.21\r
STRESS-0672,"Electronics Product 672",DE,Shopify,Electronics,7.91,21.87,12,3.45,8,5.6,343,TRUE,FALSE,3411.72,360,293.93,164.98\r
STRESS-0673,"Home & Kitchen Product 673",FR,Amazon,Home & Kitchen,9.52,18.37,14,5.12,1,4.8,116,TRUE,TRUE,44.09,45,26.45,18.52\r
STRESS-0674,"Sports & Outdoors Product 674",IT,WooCommerce,Sports & Outdoors,33.57,56.88,15,5.35,9,4.7,294,TRUE,TRUE,1228.61,405,721.81,374.65\r
STRESS-0675,"Beauty & Health Product 675",ES,Shopify,Beauty & Health,29.18,61.79,12,5.53,19,6.9,370,TRUE,FALSE,2817.62,855,2430.2,846.91\r
STRESS-0676,"Apparel Product 676",DE,Amazon,Apparel,28.15,63.66,14,3.18,19,5,493,TRUE,TRUE,2902.9,855,1814.31,868.22\r
STRESS-0677,"Pet Supplies Product 677",FR,WooCommerce,Pet Supplies,28.18,62.06,12,3.21,23,6.2,395,TRUE,FALSE,3425.71,1035,2654.93,1028.93\r
STRESS-0678,"Electronics Product 678",IT,Shopify,Electronics,14.43,26.74,13,4.78,5,5.5,465,TRUE,FALSE,320.88,225,220.6,117.72\r
STRESS-0679,"Home & Kitchen Product 679",ES,Amazon,Home & Kitchen,13.17,33.84,13,2.57,22,2.4,127,TRUE,FALSE,1786.75,990,536.03,611.69\r
STRESS-0680,"Sports & Outdoors Product 680",DE,WooCommerce,Sports & Outdoors,18.07,45.67,15,20.55,14,3.6,226,TRUE,TRUE,1534.51,630,690.53,488.63\r
STRESS-0681,"Beauty & Health Product 681",FR,Shopify,Beauty & Health,11.25,28.69,13,2.74,8,6.4,94,FALSE,TRUE,550.85,360,440.68,197.71\r
STRESS-0682,"Apparel Product 682",IT,Amazon,Apparel,31.24,81.85,15,4.49,18,4,470,TRUE,FALSE,3535.92,810,1767.96,1018.98\r
STRESS-0683,"Pet Supplies Product 683",ES,WooCommerce,Pet Supplies,34.21,68.45,15,3.26,8,3.5,63,FALSE,TRUE,1314.24,360,574.98,388.56\r
STRESS-0684,"Electronics Product 684",DE,Shopify,Electronics,20.9,45.12,14,5.44,17,2.8,131,TRUE,FALSE,1840.9,765,644.31,587.72\r
STRESS-0685,"Home & Kitchen Product 685",FR,Amazon,Home & Kitchen,18.7,39.43,13,4.13,9,6,266,TRUE,TRUE,851.69,405,638.77,280.42\r
STRESS-0686,"Sports & Outdoors Product 686",IT,WooCommerce,Sports & Outdoors,20.42,47.98,14,3.88,21,6.2,107,TRUE,FALSE,2418.19,945,1874.1,762.05\r
STRESS-0687,"Beauty & Health Product 687",ES,Shopify,Beauty & Health,28.03,72.99,13,5.94,8,5.5,133,FALSE,FALSE,1401.41,360,963.47,410.35\r
STRESS-0688,"Apparel Product 688",DE,Amazon,Apparel,56.76,52.56,14,3.63,1,3.8,148,TRUE,TRUE,126.14,45,59.92,39.04\r
STRESS-0689,"Pet Supplies Product 689",FR,WooCommerce,Pet Supplies,26.72,70.56,15,5.87,3,4.5,362,TRUE,TRUE,508.03,135,285.77,149.51\r
STRESS-0690,"Electronics Product 690",IT,Shopify,Electronics,49.63,87.48,15,2.95,23,6.4,473,TRUE,TRUE,4828.9,1035,3863.12,1379.72\r
STRESS-0691,"Home & Kitchen Product 691",ES,Amazon,Home & Kitchen,12.28,21.74,15,4.97,12,3,267,TRUE,TRUE,626.11,540,234.79,246.53\r
STRESS-0692,"Sports & Outdoors Product 692",DE,WooCommerce,Sports & Outdoors,15.62,32.91,14,5.96,14,4.9,118,TRUE,FALSE,1105.78,630,677.29,381.44\r
STRESS-0693,"Beauty & Health Product 693",FR,Shopify,Beauty & Health,28.05,79.64,12,4.54,10,5.9,115,TRUE,FALSE,1911.36,450,1409.63,552.84\r
STRESS-0694,"Apparel Product 694",IT,Amazon,Apparel,30.19,58.14,12,5.55,23,3.2,434,TRUE,TRUE,3209.33,1035,1283.73,974.83\r
STRESS-0695,"Pet Supplies Product 695",ES,WooCommerce,Pet Supplies,24.51,55.02,13,4.45,24,2.7,206,TRUE,FALSE,3169.15,1080,1069.59,972.29\r
STRESS-0696,"Electronics Product 696",DE,Shopify,Electronics,33.56,81.91,15,4.84,6,22.5,369,TRUE,FALSE,1179.5,270,3685.95,339.88\r
STRESS-0697,"Home & Kitchen Product 697",FR,Amazon,Home & Kitchen,15.62,35.34,12,4.87,10,3.4,119,TRUE,TRUE,848.16,450,360.47,287.04\r
STRESS-0698,"Sports & Outdoors Product 698",IT,WooCommerce,Sports & Outdoors,27.2,57.19,13,4.83,9,3.2,210,TRUE,TRUE,1235.3,405,494.12,376.33\r
STRESS-0699,"Beauty & Health Product 699",ES,Shopify,Beauty & Health,20.75,49.79,12,3.99,19,4.9,326,FALSE,TRUE,2270.42,855,1390.63,710.11\r
STRESS-0700,"Apparel Product 700",DE,Amazon,Apparel,30.38,78.99,12,2.67,12,6.5,229,FALSE,FALSE,2274.91,540,1848.37,658.73\r
STRESS-0701,"Pet Supplies Product 701",FR,WooCommerce,Pet Supplies,54.85,96.99,14,3.76,21,6.2,113,TRUE,FALSE,4888.3,945,3788.43,1379.57\r
STRESS-0702,"Electronics Product 702",IT,Shopify,Electronics,15.08,32,13,5.57,18,4.8,153,TRUE,TRUE,1382.4,810,829.44,480.6\r
STRESS-0703,"Home & Kitchen Product 703",ES,Amazon,Home & Kitchen,36.29,65.57,14,5.16,3,3.7,494,FALSE,TRUE,472.1,135,218.35,140.53\r
STRESS-0704,"Sports & Outdoors Product 704",DE,WooCommerce,Sports & Outdoors,21.23,43.74,15,4.72,17,5.3,150,TRUE,TRUE,14499.81,765,1182.29,573.65\r
STRESS-0705,"Beauty & Health Product 705",FR,Shopify,Beauty & Health,7.78,20.36,15,4.06,17,5,355,TRUE,TRUE,830.69,765,519.18,335.17\r
STRESS-0706,"Apparel Product 706",IT,Amazon,Apparel,7.66,15.43,15,2.7,2,3.5,415,TRUE,TRUE,74.06,90,32.4,33.52\r
STRESS-0707,"Pet Supplies Product 707",ES,WooCommerce,Pet Supplies,12.15,30.75,14,3.77,18,6.4,374,TRUE,FALSE,1328.4,810,1062.72,467.1\r
STRESS-0708,"Electronics Product 708",DE,Shopify,Electronics,21.87,44.63,14,3.19,17,2.8,131,FALSE,TRUE,1820.9,765,637.32,582.73\r
STRESS-0709,"Home & Kitchen Product 709",FR,Amazon,Home & Kitchen,15.86,33.24,12,2.9,5,2.7,376,TRUE,TRUE,398.88,225,134.62,137.22\r
STRESS-0710,"Sports & Outdoors Product 710",IT,WooCommerce,Sports & Outdoors,50.12,99.98,13,3.73,8,3.9,148,TRUE,FALSE,1919.62,360,935.81,539.9\r
STRESS-0711,"Beauty & Health Product 711",ES,Shopify,Beauty & Health,10.96,30.64,13,4.1,5,5.2,248,TRUE,FALSE,367.68,225,238.99,129.42\r
STRESS-0712,"Apparel Product 712",DE,Amazon,Apparel,27.87,59.57,13,26.81,20,2.5,362,TRUE,FALSE,2859.36,900,893.55,864.84\r
STRESS-0713,"Pet Supplies Product 713",FR,WooCommerce,Pet Supplies,40.7,90.05,12,5.05,4,6.8,278,TRUE,FALSE,864.48,180,734.81,246.12\r
STRESS-0714,"Electronics Product 714",IT,Shopify,Electronics,24.3,51.08,12,5.71,25,7,374,TRUE,TRUE,3064.8,1125,2681.7,953.7\r
STRESS-0715,"Home & Kitchen Product 715",ES,Amazon,Home & Kitchen,11.66,29.82,14,4.75,8,3.8,158,TRUE,FALSE,572.54,360,271.96,203.14\r
STRESS-0716,"Sports & Outdoors Product 716",DE,WooCommerce,Sports & Outdoors,20.39,39.53,15,2.95,2,6.2,154,TRUE,TRUE,189.74,90,147.05,62.44\r
STRESS-0717,"Beauty & Health Product 717",FR,Shopify,Beauty & Health,25.58,46.3,13,4.42,10,4.8,437,FALSE,TRUE,1111.2,450,666.72,352.8\r
STRESS-0718,"Apparel Product 718",IT,Amazon,Apparel,34.97,96.16,15,5.83,2,5.2,374,TRUE,TRUE,461.57,90,300.02,130.39\r
STRESS-0719,"Pet Supplies Product 719",ES,WooCommerce,Pet Supplies,51.54,92.63,14,4.31,16,3.9,251,FALSE,FALSE,3556.99,720,1734.03,1009.25\r
STRESS-0720,"Electronics Product 720",DE,Shopify,Electronics,12,22.28,12,3.32,18,22.5,391,TRUE,FALSE,962.5,810,3007.8,375.62\r
STRESS-0721,"Home & Kitchen Product 721",FR,Amazon,Home & Kitchen,46.82,84.83,13,3.35,3,6.5,58,FALSE,TRUE,610.78,135,496.26,175.19\r
STRESS-0722,"Sports & Outdoors Product 722",IT,WooCommerce,Sports & Outdoors,10.31,27.46,13,3.22,20,2.3,68,TRUE,FALSE,1318.08,900,378.95,479.52\r
STRESS-0723,"Beauty & Health Product 723",ES,Shopify,Beauty & Health,31.82,61.8,12,2.81,23,3.2,356,TRUE,FALSE,3411.36,1035,1364.54,1025.34\r
STRESS-0724,"Apparel Product 724",DE,Amazon,Apparel,43.69,79.97,13,5.43,18,6.3,404,TRUE,FALSE,3454.7,810,2720.58,998.68\r
STRESS-0725,"Pet Supplies Product 725",FR,WooCommerce,Pet Supplies,27.06,66.9,13,4.1,16,4.6,100,TRUE,TRUE,2568.96,720,1477.15,762.24\r
STRESS-0726,"Electronics Product 726",IT,Shopify,Electronics,39.1,67.67,14,3.15,4,2.1,268,TRUE,TRUE,649.63,180,170.53,192.41\r
STRESS-0727,"Home & Kitchen Product 727",ES,Amazon,Home & Kitchen,26.96,56.71,12,3.48,22,6.6,107,TRUE,TRUE,2994.29,990,2470.29,913.57\r
STRESS-0728,"Sports & Outdoors Product 728",DE,WooCommerce,Sports & Outdoors,38.02,75.11,14,33.8,19,4.4,129,TRUE,TRUE,3425.02,855,1883.76,998.75\r
STRESS-0729,"Beauty & Health Product 729",FR,Shopify,Beauty & Health,36.45,72.89,12,5.4,3,3.3,462,TRUE,FALSE,524.81,135,216.48,153.7\r
STRESS-0730,"Apparel Product 730",IT,Amazon,Apparel,37.84,83.79,15,3.79,22,5.8,430,TRUE,TRUE,4424.11,990,3207.48,1271.03\r
STRESS-0731,"Pet Supplies Product 731",ES,WooCommerce,Pet Supplies,13.38,28.72,14,2.83,19,4.4,107,TRUE,FALSE,1309.63,855,720.3,469.91\r
STRESS-0732,"Electronics Product 732",DE,Shopify,Electronics,42.26,71.11,15,4.21,25,2.6,464,FALSE,TRUE,4266.6,1125,1386.65,1254.15\r
STRESS-0733,"Home & Kitchen Product 733",FR,Amazon,Home & Kitchen,34.63,82.9,15,3.29,4,2,318,TRUE,TRUE,795.84,180,198.96,228.96\r
STRESS-0734,"Sports & Outdoors Product 734",IT,WooCommerce,Sports & Outdoors,19.5,45.85,12,2.84,11,4.8,430,TRUE,TRUE,1210.44,495,726.26,385.11\r
STRESS-0735,"Beauty & Health Product 735",ES,Shopify,Beauty & Health,11.46,32.43,13,3.64,13,6.5,281,FALSE,FALSE,1011.82,585,822.1,350.45\r
STRESS-0736,"Apparel Product 736",DE,Amazon,Apparel,27.77,54.63,12,2.71,22,5.7,316,TRUE,TRUE,23436.27,990,2055.18,886.12\r
STRESS-0737,"Pet Supplies Product 737",FR,WooCommerce,Pet Supplies,32.45,84.67,15,2.85,14,5.7,256,TRUE,TRUE,2844.91,630,2027,816.23\r
STRESS-0738,"Electronics Product 738",IT,Shopify,Electronics,25.94,58.38,15,2.74,23,5.6,365,TRUE,FALSE,3222.58,1035,2255.8,978.14\r
STRESS-0739,"Home & Kitchen Product 739",ES,Amazon,Home & Kitchen,31.12,87.98,14,5.29,8,5,186,TRUE,TRUE,1689.22,360,1055.76,482.3\r
STRESS-0740,"Sports & Outdoors Product 740",DE,WooCommerce,Sports & Outdoors,15.89,28.19,13,3.7,11,5.3,137,TRUE,TRUE,744.22,495,493.04,268.55\r
STRESS-0741,"Beauty & Health Product 741",FR,Shopify,Beauty & Health,20.92,46.52,13,3.09,7,3,50,FALSE,FALSE,781.54,315,293.08,247.88\r
STRESS-0742,"Apparel Product 742",IT,Amazon,Apparel,45.63,98.82,13,4.28,24,2.6,164,FALSE,FALSE,5692.03,1080,1849.91,1603.01\r
STRESS-0743,"Pet Supplies Product 743",ES,WooCommerce,Pet Supplies,35.02,60.69,14,4.47,10,6.5,342,TRUE,TRUE,1456.56,450,1183.45,439.14\r
STRESS-0744,"Electronics Product 744",DE,Shopify,Electronics,8.18,22.86,15,4.64,17,22.5,306,TRUE,TRUE,932.69,765,2914.65,360.67\r
STRESS-0745,"Home & Kitchen Product 745",FR,Amazon,Home & Kitchen,31.66,65.26,15,5.77,24,5.8,389,TRUE,TRUE,3758.98,1080,2725.26,1119.74\r
STRESS-0746,"Sports & Outdoors Product 746",IT,WooCommerce,Sports & Outdoors,23.17,43.2,14,4.14,7,5.8,446,TRUE,TRUE,725.76,315,526.18,233.94\r
STRESS-0747,"Beauty & Health Product 747",ES,Shopify,Beauty & Health,43.18,90.66,13,4.49,15,2.3,140,FALSE,FALSE,3263.76,675,938.33,928.44\r
STRESS-0748,"Apparel Product 748",DE,Amazon,Apparel,9.48,27,13,5.08,21,3.7,329,TRUE,TRUE,1360.8,945,629.37,497.7\r
STRESS-0749,"Pet Supplies Product 749",FR,WooCommerce,Pet Supplies,30.38,84.34,13,4.78,9,2.9,353,TRUE,TRUE,1821.74,405,660.38,522.94\r
STRESS-0750,"Electronics Product 750",IT,Shopify,Electronics,38.54,70.7,15,5.48,10,2.9,339,TRUE,TRUE,1696.8,450,615.09,499.2\r
STRESS-0751,"Home & Kitchen Product 751",ES,Amazon,Home & Kitchen,32.06,86.04,13,4.73,21,3,158,TRUE,FALSE,4336.42,945,1626.16,1241.6\r
STRESS-0752,"Sports & Outdoors Product 752",DE,WooCommerce,Sports & Outdoors,19.87,18.4,14,4.3,13,5.3,491,FALSE,FALSE,574.08,585,380.33,241.02\r
STRESS-0753,"Beauty & Health Product 753",FR,Shopify,Beauty & Health,24.17,44.53,13,5.19,17,5.2,109,TRUE,TRUE,1816.82,765,1180.94,581.71\r
STRESS-0754,"Apparel Product 754",IT,Amazon,Apparel,17.37,30.15,12,2.78,5,6.1,211,TRUE,TRUE,361.8,225,275.87,127.95\r
STRESS-0755,"Pet Supplies Product 755",ES,WooCommerce,Pet Supplies,24.76,45.25,14,5.45,19,5.5,171,TRUE,FALSE,2063.4,855,1418.59,658.35\r
STRESS-0756,"Electronics Product 756",DE,Shopify,Electronics,31.35,53.22,12,2.99,18,2.4,472,TRUE,FALSE,2299.1,810,689.73,709.78\r
STRESS-0757,"Home & Kitchen Product 757",FR,Amazon,Home & Kitchen,27.83,75.12,12,2.62,24,6.9,386,FALSE,TRUE,4326.91,1080,3731.96,1261.73\r
STRESS-0758,"Sports & Outdoors Product 758",IT,WooCommerce,Sports & Outdoors,10.35,27.34,14,4.37,24,3.9,310,TRUE,TRUE,1574.78,1080,767.71,573.7\r
STRESS-0759,"Beauty & Health Product 759",ES,Shopify,Beauty & Health,8.62,19.24,12,4.71,22,3.4,448,FALSE,FALSE,1015.87,990,431.75,418.97\r
STRESS-0760,"Apparel Product 760",DE,Amazon,Apparel,24.14,46.61,12,20.97,8,4.8,355,TRUE,TRUE,894.91,360,536.95,283.73\r
STRESS-0761,"Pet Supplies Product 761",FR,WooCommerce,Pet Supplies,8.8,15.15,13,4.89,10,2.5,302,TRUE,FALSE,363.6,450,113.63,165.9\r
STRESS-0762,"Electronics Product 762",IT,Shopify,Electronics,53.1,93.83,15,3.05,1,6.7,337,TRUE,FALSE,225.19,45,188.6,63.8\r
STRESS-0763,"Home & Kitchen Product 763",ES,Amazon,Home & Kitchen,28.99,76.61,12,3.24,14,5.9,123,TRUE,TRUE,2574.1,630,1898.4,748.52\r
STRESS-0764,"Sports & Outdoors Product 764",DE,WooCommerce,Sports & Outdoors,48.03,90.93,15,3.39,19,5.4,141,TRUE,TRUE,4146.41,855,2798.83,1179.1\r
STRESS-0765,"Beauty & Health Product 765",FR,Shopify,Beauty & Health,20.14,40.46,13,4.07,18,2.2,212,TRUE,TRUE,1747.87,810,480.66,571.97\r
STRESS-0766,"Apparel Product 766",IT,Amazon,Apparel,27.72,48.65,15,5.56,16,3.9,165,TRUE,TRUE,1868.16,720,910.73,587.04\r
STRESS-0767,"Pet Supplies Product 767",ES,WooCommerce,Pet Supplies,35.45,60.18,13,2.85,16,2.3,432,TRUE,TRUE,2310.91,720,664.39,697.73\r
STRESS-0768,"Electronics Product 768",DE,Shopify,Electronics,21.09,53.91,12,2.64,24,4.9,268,TRUE,TRUE,25229.88,1080,1901.94,956.3\r
STRESS-0769,"Home & Kitchen Product 769",FR,Amazon,Home & Kitchen,16.28,28.34,15,3.67,22,2.3,110,TRUE,TRUE,1496.35,990,430.2,539.09\r
STRESS-0770,"Sports & Outdoors Product 770",IT,WooCommerce,Sports & Outdoors,37.94,90.91,12,4.91,23,3.6,225,TRUE,TRUE,5018.23,1035,2258.2,1427.06\r
STRESS-0771,"Beauty & Health Product 771",ES,Shopify,Beauty & Health,25.94,50.3,15,5.53,25,6.9,80,FALSE,TRUE,3018,1125,2603.03,942\r
STRESS-0772,"Apparel Product 772",DE,Amazon,Apparel,14.17,25.2,15,3.19,4,3,358,FALSE,TRUE,241.92,180,90.72,90.48\r
STRESS-0773,"Pet Supplies Product 773",FR,WooCommerce,Pet Supplies,41.77,73.21,14,3.74,23,6.5,464,TRUE,TRUE,4041.19,1035,3283.47,1182.8\r
STRESS-0774,"Electronics Product 774",IT,Shopify,Electronics,21.64,47.46,12,4.68,18,5.4,174,TRUE,TRUE,2050.27,810,1383.93,647.57\r
STRESS-0775,"Home & Kitchen Product 775",ES,Amazon,Home & Kitchen,41.83,91.07,13,3.91,18,2.1,235,TRUE,TRUE,3934.22,810,1032.73,1118.56\r
STRESS-0776,"Sports & Outdoors Product 776",DE,WooCommerce,Sports & Outdoors,23,56.12,12,25.25,25,2.8,282,TRUE,FALSE,3367.2,1125,1178.52,1029.3\r
STRESS-0777,"Beauty & Health Product 777",FR,Shopify,Beauty & Health,36.23,82.5,15,4.88,13,5.9,328,TRUE,TRUE,2574,585,1898.33,741\r
STRESS-0778,"Apparel Product 778",IT,Amazon,Apparel,31.03,65.97,12,5.67,16,4.3,451,TRUE,TRUE,2533.25,720,1361.62,753.31\r
STRESS-0779,"Pet Supplies Product 779",ES,WooCommerce,Pet Supplies,30.07,52.16,12,3.69,2,2.8,300,TRUE,FALSE,250.37,90,87.63,77.59\r
STRESS-0780,"Electronics Product 780",DE,Shopify,Electronics,15.16,38.64,13,5.1,16,6.6,88,TRUE,FALSE,1483.78,720,1224.12,490.94\r
STRESS-0781,"Home & Kitchen Product 781",FR,Amazon,Home & Kitchen,33.51,58.74,15,5.76,7,3,243,TRUE,TRUE,986.83,315,370.06,299.21\r
STRESS-0782,"Sports & Outdoors Product 782",IT,WooCommerce,Sports & Outdoors,17.74,39.99,13,2.51,17,4.5,164,TRUE,FALSE,1631.59,765,917.77,535.4\r
STRESS-0783,"Beauty & Health Product 783",ES,Shopify,Beauty & Health,33.4,94.99,13,3.77,15,2.6,401,FALSE,FALSE,3419.64,675,1111.38,967.41\r
STRESS-0784,"Apparel Product 784",DE,Amazon,Apparel,87.26,80.8,15,4.82,17,3.1,401,TRUE,FALSE,3296.64,765,1277.45,951.66\r
STRESS-0785,"Pet Supplies Product 785",FR,WooCommerce,Pet Supplies,20.9,59.59,14,4.31,10,3.3,80,TRUE,FALSE,1430.16,450,589.94,432.54\r
STRESS-0786,"Electronics Product 786",IT,Shopify,Electronics,47.14,89.06,14,3.93,22,3.4,182,TRUE,TRUE,4702.37,990,1998.51,1340.59\r
STRESS-0787,"Home & Kitchen Product 787",ES,Amazon,Home & Kitchen,12.64,23.32,12,4.52,11,6.5,73,FALSE,TRUE,615.65,495,500.21,236.41\r
STRESS-0788,"Sports & Outdoors Product 788",DE,WooCommerce,Sports & Outdoors,33.23,57.11,15,4.6,8,5.9,73,TRUE,FALSE,1096.51,360,808.68,334.13\r
STRESS-0789,"Beauty & Health Product 789",FR,Shopify,Beauty & Health,21.58,39.05,15,3.47,19,2.4,446,TRUE,TRUE,1780.68,855,534.2,587.67\r
STRESS-0790,"Apparel Product 790",IT,Amazon,Apparel,6.5,17.82,15,3.74,6,5.9,156,TRUE,TRUE,256.61,270,189.25,109.15\r
STRESS-0791,"Pet Supplies Product 791",ES,WooCommerce,Pet Supplies,27.52,69.72,14,3.25,5,4.5,300,FALSE,FALSE,836.64,225,470.61,246.66\r
STRESS-0792,"Electronics Product 792",DE,Shopify,Electronics,37.58,93.74,15,5.57,25,22.5,105,TRUE,TRUE,5624.4,1125,17576.25,1593.6\r
STRESS-0793,"Home & Kitchen Product 793",FR,Amazon,Home & Kitchen,19.37,49.43,15,5.43,20,6.9,274,TRUE,TRUE,2372.64,900,2046.4,743.16\r
STRESS-0794,"Sports & Outdoors Product 794",IT,WooCommerce,Sports & Outdoors,14.36,34.66,12,5.27,20,3.9,361,TRUE,TRUE,1663.68,900,811.04,565.92\r
STRESS-0795,"Beauty & Health Product 795",ES,Shopify,Beauty & Health,40.26,80.33,14,3.46,2,6.7,416,TRUE,TRUE,385.58,90,322.93,111.4\r
STRESS-0796,"Apparel Product 796",DE,Amazon,Apparel,14.79,29.44,12,5.3,11,4.7,62,TRUE,TRUE,777.22,495,456.61,276.8\r
STRESS-0797,"Pet Supplies Product 797",FR,WooCommerce,Pet Supplies,11.67,29.6,12,3.94,14,5.9,370,FALSE,FALSE,994.56,630,733.49,353.64\r
STRESS-0798,"Electronics Product 798",IT,Shopify,Electronics,9.86,16.46,14,3.6,20,2.4,468,TRUE,FALSE,790.08,900,237.02,347.52\r
STRESS-0799,"Home & Kitchen Product 799",ES,Amazon,Home & Kitchen,14.7,31.87,14,5.63,11,2.6,397,TRUE,TRUE,841.37,495,273.44,292.84\r
STRESS-0800,"Sports & Outdoors Product 800",DE,WooCommerce,Sports & Outdoors,45.14,79.5,14,4.52,17,6.3,259,TRUE,FALSE,26354.25,765,2554.34,938.4\r
STRESS-0801,"Beauty & Health Product 801",FR,Shopify,Beauty & Health,21.96,41.66,15,5.96,9,2.1,330,TRUE,FALSE,899.86,405,236.21,292.46\r
STRESS-0802,"Apparel Product 802",IT,Amazon,Apparel,35.55,67.33,15,5.62,25,3.8,52,TRUE,FALSE,4039.8,1125,1918.9,1197.45\r
STRESS-0803,"Pet Supplies Product 803",ES,WooCommerce,Pet Supplies,45.46,75.84,13,4.56,13,3.5,280,FALSE,FALSE,2366.21,585,1035.22,689.05\r
STRESS-0804,"Electronics Product 804",DE,Shopify,Electronics,8.93,21.26,12,2.85,23,3.5,228,TRUE,TRUE,1173.55,1035,513.43,465.89\r
STRESS-0805,"Home & Kitchen Product 805",FR,Amazon,Home & Kitchen,20.05,54.03,12,2.87,18,5.1,197,TRUE,FALSE,2334.1,810,1487.99,718.52\r
STRESS-0806,"Sports & Outdoors Product 806",IT,WooCommerce,Sports & Outdoors,18.63,40.5,14,4.52,10,5.9,381,TRUE,FALSE,972,450,716.85,318\r
STRESS-0807,"Beauty & Health Product 807",ES,Shopify,Beauty & Health,13.99,26.4,15,4.67,24,6.7,264,TRUE,TRUE,1520.64,1080,1273.54,560.16\r
STRESS-0808,"Apparel Product 808",DE,Amazon,Apparel,11.87,20.94,15,9.42,18,4.2,214,TRUE,TRUE,904.61,810,474.92,361.15\r
STRESS-0809,"Pet Supplies Product 809",FR,WooCommerce,Pet Supplies,36.81,90.64,14,4.82,24,3.7,340,TRUE,FALSE,5220.86,1080,2414.65,1485.22\r
STRESS-0810,"Electronics Product 810",IT,Shopify,Electronics,21.38,48.81,15,4.45,13,2.5,357,FALSE,FALSE,1522.87,585,475.9,478.22\r
STRESS-0811,"Home & Kitchen Product 811",ES,Amazon,Home & Kitchen,43.55,99.37,12,2.93,9,3.7,203,TRUE,TRUE,2146.39,405,992.71,604.1\r
STRESS-0812,"Sports & Outdoors Product 812",DE,WooCommerce,Sports & Outdoors,17.89,37.8,15,4.18,14,5.7,478,FALSE,FALSE,1270.08,630,904.93,422.52\r
STRESS-0813,"Beauty & Health Product 813",FR,Shopify,Beauty & Health,31.92,56.69,13,4.28,14,3.2,350,TRUE,FALSE,1904.78,630,761.91,581.2\r
STRESS-0814,"Apparel Product 814",IT,Amazon,Apparel,9.15,15.28,15,3.19,15,3,329,TRUE,TRUE,550.08,675,206.28,250.02\r
STRESS-0815,"Pet Supplies Product 815",ES,WooCommerce,Pet Supplies,28.16,56.31,15,5.28,17,3.3,459,TRUE,TRUE,2297.45,765,947.7,701.86\r
STRESS-0816,"Electronics Product 816",DE,Shopify,Electronics,15.53,32.89,13,4.92,24,22.5,446,TRUE,FALSE,1894.46,1080,5920.2,653.62\r
STRESS-0817,"Home & Kitchen Product 817",FR,Amazon,Home & Kitchen,8.96,18.12,13,4.88,19,4.8,106,TRUE,TRUE,826.27,855,495.76,349.07\r
STRESS-0818,"Sports & Outdoors Product 818",IT,WooCommerce,Sports & Outdoors,36.49,76.82,12,5.96,10,3.7,142,TRUE,FALSE,1843.68,450,852.7,535.92\r
STRESS-0819,"Beauty & Health Product 819",ES,Shopify,Beauty & Health,20.9,48.55,12,3.29,13,5,376,TRUE,TRUE,1514.76,585,946.73,476.19\r
STRESS-0820,"Apparel Product 820",DE,Amazon,Apparel,46.3,85.89,15,4.91,7,6.7,345,FALSE,TRUE,1442.95,315,1208.47,413.24\r
STRESS-0821,"Pet Supplies Product 821",FR,WooCommerce,Pet Supplies,19.28,32.92,14,4.61,10,3.4,439,TRUE,TRUE,790.08,450,335.78,272.52\r
STRESS-0822,"Electronics Product 822",IT,Shopify,Electronics,8.48,20.14,15,4.18,1,5.7,391,TRUE,FALSE,48.34,45,34.44,19.58\r
STRESS-0823,"Home & Kitchen Product 823",ES,Amazon,Home & Kitchen,8.19,17.8,13,3.24,16,5.1,144,TRUE,TRUE,683.52,720,435.74,290.88\r
STRESS-0824,"Sports & Outdoors Product 824",DE,WooCommerce,Sports & Outdoors,25.19,54.87,13,24.69,4,4.4,390,TRUE,FALSE,526.75,180,289.71,161.69\r
STRESS-0825,"Beauty & Health Product 825",FR,Shopify,Beauty & Health,52.8,98.69,13,4.57,6,6.3,460,FALSE,FALSE,1421.14,270,1119.14,400.28\r
STRESS-0826,"Apparel Product 826",IT,Amazon,Apparel,18.06,30.25,14,4.83,14,2.1,235,FALSE,FALSE,1016.4,630,266.81,359.1\r
STRESS-0827,"Pet Supplies Product 827",ES,WooCommerce,Pet Supplies,19.8,55.59,12,4.66,4,4,301,TRUE,FALSE,533.66,180,266.83,163.42\r
STRESS-0828,"Electronics Product 828",DE,Shopify,Electronics,24.59,49.89,13,5.48,2,4.8,389,TRUE,FALSE,239.47,90,143.68,74.87\r
STRESS-0829,"Home & Kitchen Product 829",FR,Amazon,Home & Kitchen,15,37.23,12,4.11,24,2.7,473,TRUE,TRUE,2144.45,1080,723.75,716.11\r
STRESS-0830,"Sports & Outdoors Product 830",IT,WooCommerce,Sports & Outdoors,20.02,38.23,12,3.93,1,3.2,62,TRUE,TRUE,91.75,45,36.7,30.44\r
STRESS-0831,"Beauty & Health Product 831",ES,Shopify,Beauty & Health,26.82,65.64,13,4.6,24,4.7,365,TRUE,TRUE,3780.86,1080,2221.26,1125.22\r
STRESS-0832,"Apparel Product 832",DE,Amazon,Apparel,16.8,37.81,12,3.18,13,4.4,463,FALSE,FALSE,9584.84,585,648.82,392.42\r
STRESS-0833,"Pet Supplies Product 833",FR,WooCommerce,Pet Supplies,54.24,93.08,15,2.85,13,3.6,99,TRUE,TRUE,2904.1,585,1306.84,823.52\r
STRESS-0834,"Electronics Product 834",IT,Shopify,Electronics,39.41,76.09,15,5.31,23,6.2,334,TRUE,TRUE,4200.17,1035,3255.13,1222.54\r
STRESS-0835,"Home & Kitchen Product 835",ES,Amazon,Home & Kitchen,25.85,69.08,12,3.63,22,3.3,62,TRUE,TRUE,3647.42,990,1504.56,1076.86\r
STRESS-0836,"Sports & Outdoors Product 836",DE,WooCommerce,Sports & Outdoors,21.99,61.74,12,3.03,16,6.1,115,TRUE,FALSE,2370.82,720,1807.75,712.7\r
STRESS-0837,"Beauty & Health Product 837",FR,Shopify,Beauty & Health,32.14,69.2,12,3.6,5,3.8,307,TRUE,TRUE,830.4,225,394.44,245.1\r
STRESS-0838,"Apparel Product 838",IT,Amazon,Apparel,28.58,72.93,14,4.78,17,3.1,181,TRUE,TRUE,2975.54,765,1153.02,871.39\r
STRESS-0839,"Pet Supplies Product 839",ES,WooCommerce,Pet Supplies,20.93,48.89,14,4.02,11,3.3,383,TRUE,FALSE,1290.7,495,532.41,405.17\r
STRESS-0840,"Electronics Product 840",DE,Shopify,Electronics,11.04,29.93,15,5.59,2,22.5,172,FALSE,TRUE,143.66,90,448.95,50.92\r
STRESS-0841,"Home & Kitchen Product 841",FR,Amazon,Home & Kitchen,10.91,29.28,14,3.5,9,4.9,115,TRUE,TRUE,632.45,405,387.37,225.61\r
STRESS-0842,"Sports & Outdoors Product 842",IT,WooCommerce,Sports & Outdoors,34.57,97.78,12,3.84,17,6.9,337,TRUE,FALSE,3989.42,765,3440.88,1124.86\r
STRESS-0843,"Beauty & Health Product 843",ES,Shopify,Beauty & Health,17.51,36.15,12,5.69,20,3.3,491,TRUE,FALSE,1735.2,900,715.77,583.8\r
STRESS-0844,"Apparel Product 844",DE,Amazon,Apparel,52.91,90.12,12,4.46,3,6.4,102,TRUE,FALSE,648.86,135,519.09,184.72\r
STRESS-0845,"Pet Supplies Product 845",FR,WooCommerce,Pet Supplies,39.19,92.3,14,4.05,25,2,468,FALSE,TRUE,5538,1125,1384.5,1572\r
STRESS-0846,"Electronics Product 846",IT,Shopify,Electronics,13.09,35.72,13,2.95,4,3.6,280,TRUE,TRUE,342.91,180,154.31,115.73\r
STRESS-0847,"Home & Kitchen Product 847",ES,Amazon,Home & Kitchen,32.08,56.92,14,2.87,20,2,106,TRUE,TRUE,2732.16,900,683.04,833.04\r
STRESS-0848,"Sports & Outdoors Product 848",DE,WooCommerce,Sports & Outdoors,82.74,76.61,14,2.94,23,4,424,TRUE,TRUE,4228.87,1035,2114.44,1229.72\r
STRESS-0849,"Beauty & Health Product 849",FR,Shopify,Beauty & Health,49.48,96.44,13,4.76,16,5.7,442,TRUE,FALSE,3703.3,720,2638.6,1045.82\r
STRESS-0850,"Apparel Product 850",IT,Amazon,Apparel,45.28,85.21,14,5.17,4,5.4,230,TRUE,TRUE,818.02,180,552.16,234.5\r
STRESS-0851,"Pet Supplies Product 851",ES,WooCommerce,Pet Supplies,39.96,89.84,14,2.69,23,6.9,443,TRUE,FALSE,4959.17,1035,4277.28,1412.29\r
STRESS-0852,"Electronics Product 852",DE,Shopify,Electronics,12.02,23.57,14,4.73,9,6.5,213,TRUE,TRUE,509.11,405,413.65,194.78\r
STRESS-0853,"Home & Kitchen Product 853",FR,Amazon,Home & Kitchen,6.72,15.39,13,5.56,2,4.8,302,FALSE,FALSE,73.87,90,44.32,33.47\r
STRESS-0854,"Sports & Outdoors Product 854",IT,WooCommerce,Sports & Outdoors,31.98,85.74,15,2.98,10,6,344,FALSE,FALSE,2057.76,450,1543.32,589.44\r
STRESS-0855,"Beauty & Health Product 855",ES,Shopify,Beauty & Health,14.38,35.75,15,3.84,14,3.6,77,FALSE,FALSE,1201.2,630,540.54,405.3\r
STRESS-0856,"Apparel Product 856",DE,Amazon,Apparel,11.49,19.35,12,8.71,10,5.7,117,TRUE,TRUE,464.4,450,330.88,191.1\r
STRESS-0857,"Pet Supplies Product 857",FR,WooCommerce,Pet Supplies,38.81,76.61,15,5.82,15,4.7,383,TRUE,TRUE,2757.96,675,1620.3,801.99\r
STRESS-0858,"Electronics Product 858",IT,Shopify,Electronics,19.27,41.23,12,5.37,25,6.9,345,TRUE,FALSE,2473.8,1125,2133.65,805.95\r
STRESS-0859,"Home & Kitchen Product 859",ES,Amazon,Home & Kitchen,24.22,61.9,15,3.9,6,4.6,171,TRUE,FALSE,891.36,270,512.53,267.84\r
STRESS-0860,"Sports & Outdoors Product 860",DE,WooCommerce,Sports & Outdoors,30.01,77.77,12,3.88,5,4.6,195,FALSE,FALSE,933.24,225,536.61,270.81\r
STRESS-0861,"Beauty & Health Product 861",FR,Shopify,Beauty & Health,32.75,62.18,15,5.59,18,2.5,206,FALSE,TRUE,2686.18,810,839.43,806.54\r
STRESS-0862,"Apparel Product 862",IT,Amazon,Apparel,25.55,60.82,14,2.63,25,6.7,239,TRUE,TRUE,3649.2,1125,3056.21,1099.8\r
STRESS-0863,"Pet Supplies Product 863",ES,WooCommerce,Pet Supplies,32.07,89.69,14,3.12,3,2.4,365,TRUE,TRUE,645.77,135,193.73,183.94\r
STRESS-0864,"Electronics Product 864",DE,Shopify,Electronics,17.48,43.77,12,5.75,14,4,74,FALSE,TRUE,11949.21,630,735.34,472.67\r
STRESS-0865,"Home & Kitchen Product 865",FR,Amazon,Home & Kitchen,34.93,99.27,13,5.68,8,2.4,68,FALSE,FALSE,1905.98,360,571.8,536.5\r
STRESS-0866,"Sports & Outdoors Product 866",IT,WooCommerce,Sports & Outdoors,43.03,84.8,12,4.88,6,4.9,187,TRUE,FALSE,1221.12,270,747.94,350.28\r
STRESS-0867,"Beauty & Health Product 867",ES,Shopify,Beauty & Health,8.53,20.82,12,5.1,8,2.4,454,TRUE,TRUE,399.74,360,119.92,159.94\r
STRESS-0868,"Apparel Product 868",DE,Amazon,Apparel,30.67,81.78,14,3.25,9,2.4,421,FALSE,FALSE,1766.45,405,529.93,509.11\r
STRESS-0869,"Pet Supplies Product 869",FR,WooCommerce,Pet Supplies,45.5,83.35,15,3.64,20,5.5,289,TRUE,FALSE,4000.8,900,2750.55,1150.2\r
STRESS-0870,"Electronics Product 870",IT,Shopify,Electronics,14.47,40.12,14,4.29,13,5.7,409,TRUE,TRUE,1251.74,585,891.87,410.44\r
STRESS-0871,"Home & Kitchen Product 871",ES,Amazon,Home & Kitchen,9.47,23.35,12,4.74,24,3.5,155,TRUE,FALSE,1344.96,1080,588.42,516.24\r
STRESS-0872,"Sports & Outdoors Product 872",DE,WooCommerce,Sports & Outdoors,9.84,21.72,15,9.77,11,6.3,372,TRUE,TRUE,573.41,495,451.56,225.85\r
STRESS-0873,"Beauty & Health Product 873",FR,Shopify,Beauty & Health,39.37,83.68,14,4.77,25,4.4,140,TRUE,FALSE,5020.8,1125,2761.44,1442.7\r
STRESS-0874,"Apparel Product 874",IT,Amazon,Apparel,27.2,70.56,12,6,5,5.2,318,TRUE,TRUE,846.72,225,550.37,249.18\r
STRESS-0875,"Pet Supplies Product 875",ES,WooCommerce,Pet Supplies,28.25,50.19,12,4.35,14,4.6,182,TRUE,FALSE,1686.38,630,969.67,526.6\r
STRESS-0876,"Electronics Product 876",DE,Shopify,Electronics,9.11,23.48,14,5.47,9,3.4,77,TRUE,TRUE,507.17,405,215.55,194.29\r
STRESS-0877,"Home & Kitchen Product 877",FR,Amazon,Home & Kitchen,9.72,21.64,13,5.17,20,3.4,402,TRUE,TRUE,1038.72,900,441.46,409.68\r
STRESS-0878,"Sports & Outdoors Product 878",IT,WooCommerce,Sports & Outdoors,34.99,83.35,15,3.79,4,4.4,228,TRUE,TRUE,800.16,180,440.09,230.04\r
STRESS-0879,"Beauty & Health Product 879",ES,Shopify,Beauty & Health,41.43,78.83,15,4.45,19,6.4,298,TRUE,FALSE,3594.65,855,2875.72,1041.16\r
STRESS-0880,"Apparel Product 880",DE,Amazon,Apparel,29.59,27.4,13,2.55,22,4.6,54,TRUE,TRUE,1446.72,990,831.86,526.68\r
STRESS-0881,"Pet Supplies Product 881",FR,WooCommerce,Pet Supplies,36.68,79.07,14,2.51,20,3.3,112,FALSE,FALSE,3795.36,900,1565.59,1098.84\r
STRESS-0882,"Electronics Product 882",IT,Shopify,Electronics,37.98,85.14,12,5.33,11,5.5,113,TRUE,TRUE,2247.7,495,1545.29,644.42\r
STRESS-0883,"Home & Kitchen Product 883",ES,Amazon,Home & Kitchen,11.92,32.4,12,4.81,19,5.6,489,TRUE,FALSE,1477.44,855,1034.21,511.86\r
STRESS-0884,"Sports & Outdoors Product 884",DE,WooCommerce,Sports & Outdoors,39.9,68.93,14,4.05,6,3.8,435,TRUE,TRUE,992.59,270,471.48,293.15\r
STRESS-0885,"Beauty & Health Product 885",FR,Shopify,Beauty & Health,34.16,84.6,12,3.96,23,5,207,TRUE,TRUE,4669.92,1035,2918.7,1339.98\r
STRESS-0886,"Apparel Product 886",IT,Amazon,Apparel,39.77,81.44,15,5.77,13,4.4,333,TRUE,TRUE,2540.93,585,1397.51,732.73\r
STRESS-0887,"Pet Supplies Product 887",ES,WooCommerce,Pet Supplies,37.56,63.39,15,2.73,19,2.2,257,TRUE,FALSE,2890.58,855,794.91,865.15\r
STRESS-0888,"Electronics Product 888",DE,Shopify,Electronics,40.2,72.57,14,2.91,10,22.5,138,TRUE,TRUE,1741.68,450,5442.75,510.42\r
STRESS-0889,"Home & Kitchen Product 889",FR,Amazon,Home & Kitchen,25.78,57.58,14,4.65,3,5.4,364,FALSE,FALSE,414.58,135,279.84,126.14\r
STRESS-0890,"Sports & Outdoors Product 890",IT,WooCommerce,Sports & Outdoors,13.37,34.87,12,5.75,2,5.7,383,TRUE,TRUE,167.38,90,119.26,56.84\r
STRESS-0891,"Beauty & Health Product 891",ES,Shopify,Beauty & Health,15.67,32.63,12,4.63,16,5.3,142,TRUE,FALSE,1252.99,720,830.11,433.25\r
STRESS-0892,"Apparel Product 892",DE,Amazon,Apparel,26.7,55.87,14,4.88,19,2.1,162,TRUE,TRUE,2547.67,855,668.76,779.42\r
STRESS-0893,"Pet Supplies Product 893",FR,WooCommerce,Pet Supplies,14.39,30.26,15,5.76,24,5.7,166,TRUE,FALSE,1742.98,1080,1241.87,615.74\r
STRESS-0894,"Electronics Product 894",IT,Shopify,Electronics,25.48,58.94,15,5.92,23,6.1,358,FALSE,FALSE,3253.49,1035,2480.78,985.87\r
STRESS-0895,"Home & Kitchen Product 895",ES,Amazon,Home & Kitchen,46.1,97.32,14,4.87,25,5,260,TRUE,TRUE,5839.2,1125,3649.5,1647.3\r
STRESS-0896,"Sports & Outdoors Product 896",DE,WooCommerce,Sports & Outdoors,43.26,80.84,13,3.65,19,6,464,TRUE,TRUE,29951.22,855,2764.73,1064.08\r
STRESS-0897,"Beauty & Health Product 897",FR,Shopify,Beauty & Health,44.21,95.11,13,5.51,14,5.3,110,TRUE,FALSE,3195.7,630,2117.15,903.92\r
STRESS-0898,"Apparel Product 898",IT,Amazon,Apparel,12.49,25.18,13,5.72,8,2.8,55,TRUE,FALSE,483.46,360,169.21,180.86\r
STRESS-0899,"Pet Supplies Product 899",ES,WooCommerce,Pet Supplies,53.79,93.17,15,5.5,11,3.8,182,TRUE,FALSE,2459.69,495,1168.35,697.42\r
STRESS-0900,"Electronics Product 900",DE,Shopify,Electronics,39.39,76.3,15,5.74,22,5.8,235,TRUE,TRUE,4028.64,990,2920.76,1172.16\r
STRESS-0901,"Home & Kitchen Product 901",FR,Amazon,Home & Kitchen,12.01,30.6,14,5.77,21,6,316,TRUE,FALSE,1542.24,945,1156.68,543.06\r
STRESS-0902,"Sports & Outdoors Product 902",IT,WooCommerce,Sports & Outdoors,32.46,77.85,13,3.26,21,2.9,192,TRUE,TRUE,3923.64,945,1422.32,1138.41\r
STRESS-0903,"Beauty & Health Product 903",ES,Shopify,Beauty & Health,53.24,92.12,14,4.67,21,2.4,109,TRUE,TRUE,4642.85,945,1392.85,1318.21\r
STRESS-0904,"Apparel Product 904",DE,Amazon,Apparel,8.86,15.95,12,7.18,11,6,282,TRUE,FALSE,421.08,495,315.81,187.77\r
STRESS-0905,"Pet Supplies Product 905",FR,WooCommerce,Pet Supplies,42.67,89.84,15,4.47,9,6.1,341,TRUE,FALSE,1940.54,405,1479.66,552.64\r
STRESS-0906,"Electronics Product 906",IT,Shopify,Electronics,39.42,86.49,13,4.77,12,6.4,429,TRUE,TRUE,2490.91,540,1992.73,712.73\r
STRESS-0907,"Home & Kitchen Product 907",ES,Amazon,Home & Kitchen,14.78,33,12,4.7,14,5.4,269,TRUE,FALSE,1108.8,630,748.44,382.2\r
STRESS-0908,"Sports & Outdoors Product 908",DE,WooCommerce,Sports & Outdoors,10.14,23.05,12,4.18,19,5.8,428,TRUE,TRUE,1051.08,855,762.03,405.27\r
STRESS-0909,"Beauty & Health Product 909",FR,Shopify,Beauty & Health,20.44,52.75,15,4.02,15,6.5,412,TRUE,FALSE,1899,675,1542.94,587.25\r
STRESS-0910,"Apparel Product 910",IT,Amazon,Apparel,41.35,83.09,13,3.87,21,6,253,TRUE,TRUE,4187.74,945,3140.8,1204.43\r
STRESS-0911,"Pet Supplies Product 911",ES,WooCommerce,Pet Supplies,30.08,84.1,15,4.18,7,5.3,484,TRUE,TRUE,1412.88,315,936.03,405.72\r
STRESS-0912,"Electronics Product 912",DE,Shopify,Electronics,31.83,79.21,14,5.69,20,22.5,330,TRUE,TRUE,3802.08,900,11881.5,1100.52\r
STRESS-0913,"Home & Kitchen Product 913",FR,Amazon,Home & Kitchen,16.45,38.73,12,4.42,10,6.8,58,FALSE,TRUE,929.52,450,790.09,307.38\r
STRESS-0914,"Sports & Outdoors Product 914",IT,WooCommerce,Sports & Outdoors,57.52,96.66,12,3.73,6,5.1,340,TRUE,FALSE,1391.9,270,887.34,392.98\r
STRESS-0915,"Beauty & Health Product 915",ES,Shopify,Beauty & Health,9.47,17.75,15,5.86,13,6.5,230,TRUE,TRUE,553.8,585,449.96,235.95\r
STRESS-0916,"Apparel Product 916",DE,Amazon,Apparel,20.29,55.49,13,5.56,13,4.3,453,TRUE,FALSE,1731.29,585,930.57,530.32\r
STRESS-0917,"Pet Supplies Product 917",FR,WooCommerce,Pet Supplies,19.56,53.11,15,2.51,23,4.6,106,TRUE,TRUE,2931.67,1035,1685.71,905.42\r
STRESS-0918,"Electronics Product 918",IT,Shopify,Electronics,14.01,29.45,14,5.58,16,3.7,320,TRUE,FALSE,1130.88,720,523.03,402.72\r
STRESS-0919,"Home & Kitchen Product 919",ES,Amazon,Home & Kitchen,32.52,63.13,15,3.11,14,6.5,457,TRUE,FALSE,2121.17,630,1723.45,635.29\r
STRESS-0920,"Sports & Outdoors Product 920",DE,WooCommerce,Sports & Outdoors,17.87,40.94,12,18.42,4,3,106,TRUE,FALSE,393.02,180,147.38,128.26\r
STRESS-0921,"Beauty & Health Product 921",FR,Shopify,Beauty & Health,8.55,21.7,14,5.99,23,5.7,166,TRUE,FALSE,1197.84,1035,853.46,471.96\r
STRESS-0922,"Apparel Product 922",IT,Amazon,Apparel,32,70.06,13,3.58,3,6.9,244,TRUE,TRUE,504.43,135,435.07,148.61\r
STRESS-0923,"Pet Supplies Product 923",ES,WooCommerce,Pet Supplies,12.66,29.96,13,2.72,10,2.4,60,FALSE,FALSE,719.04,450,215.71,254.76\r
STRESS-0924,"Electronics Product 924",DE,Shopify,Electronics,13.9,29.23,15,3.3,6,5.1,335,TRUE,TRUE,420.91,270,268.33,150.23\r
STRESS-0925,"Home & Kitchen Product 925",FR,Amazon,Home & Kitchen,20.5,49.23,15,5.31,6,2.9,54,TRUE,FALSE,708.91,270,256.98,222.23\r
STRESS-0926,"Sports & Outdoors Product 926",IT,WooCommerce,Sports & Outdoors,18.3,35.23,14,5.62,16,6.8,92,TRUE,TRUE,1352.83,720,1149.91,458.21\r
STRESS-0927,"Beauty & Health Product 927",ES,Shopify,Beauty & Health,25.39,61.87,13,3.27,16,3.1,207,FALSE,TRUE,2375.81,720,920.63,713.95\r
STRESS-0928,"Apparel Product 928",DE,Amazon,Apparel,36.58,85.98,14,4.12,16,6.7,223,TRUE,TRUE,26825.76,720,2765.12,945.41\r
STRESS-0929,"Pet Supplies Product 929",FR,WooCommerce,Pet Supplies,36.38,63.67,13,4.59,13,6.2,213,TRUE,TRUE,1986.5,585,1539.54,594.13\r
STRESS-0930,"Electronics Product 930",IT,Shopify,Electronics,17.4,48.12,15,2.74,10,6.4,364,TRUE,TRUE,1154.88,450,923.9,363.72\r
STRESS-0931,"Home & Kitchen Product 931",ES,Amazon,Home & Kitchen,13.48,24.59,15,2.5,24,2.9,175,TRUE,TRUE,1416.38,1080,513.44,534.1\r
STRESS-0932,"Sports & Outdoors Product 932",DE,WooCommerce,Sports & Outdoors,35.44,99.96,12,4.87,4,6.5,481,TRUE,TRUE,959.62,180,779.69,269.9\r
STRESS-0933,"Beauty & Health Product 933",FR,Shopify,Beauty & Health,25.28,69.49,14,3.89,12,3.8,346,TRUE,TRUE,2001.31,540,950.62,590.33\r
STRESS-0934,"Apparel Product 934",IT,Amazon,Apparel,28.89,52.28,15,3.27,17,3.7,101,TRUE,FALSE,2133.02,765,986.52,660.76\r
STRESS-0935,"Pet Supplies Product 935",ES,WooCommerce,Pet Supplies,33.97,80.17,12,3.63,25,3.6,387,TRUE,FALSE,4810.2,1125,2164.59,1390.05\r
STRESS-0936,"Electronics Product 936",DE,Shopify,Electronics,14.39,28.27,12,5.42,21,22.5,413,TRUE,TRUE,1424.81,945,4452.52,513.7\r
STRESS-0937,"Home & Kitchen Product 937",FR,Amazon,Home & Kitchen,24.74,44.45,12,4.37,24,3.3,95,TRUE,TRUE,2560.32,1080,1056.13,820.08\r
STRESS-0938,"Sports & Outdoors Product 938",IT,WooCommerce,Sports & Outdoors,8.12,16.55,12,3.28,8,6.1,105,TRUE,TRUE,317.76,360,242.29,139.44\r
STRESS-0939,"Beauty & Health Product 939",ES,Shopify,Beauty & Health,53.02,89.94,15,4.92,12,3.3,120,TRUE,FALSE,2590.27,540,1068.49,737.57\r
STRESS-0940,"Apparel Product 940",DE,Amazon,Apparel,16.94,36.26,15,5.51,4,2.2,90,TRUE,TRUE,348.1,180,95.73,117.02\r
STRESS-0941,"Pet Supplies Product 941",FR,WooCommerce,Pet Supplies,29.36,65.6,14,3.85,8,6.1,316,TRUE,FALSE,1259.52,360,960.38,374.88\r
STRESS-0942,"Electronics Product 942",IT,Shopify,Electronics,29.52,72.77,14,4.44,2,6.5,299,TRUE,FALSE,349.3,90,283.8,102.32\r
STRESS-0943,"Home & Kitchen Product 943",ES,Amazon,Home & Kitchen,51.96,99.89,14,3.5,5,3.5,399,TRUE,TRUE,1198.68,225,524.42,337.17\r
STRESS-0944,"Sports & Outdoors Product 944",DE,WooCommerce,Sports & Outdoors,42.68,39.52,14,5.65,7,2.7,368,FALSE,TRUE,663.94,315,224.08,218.48\r
STRESS-0945,"Beauty & Health Product 945",FR,Shopify,Beauty & Health,40.09,81.36,14,3.5,11,6.9,445,TRUE,FALSE,2147.9,495,1852.57,619.48\r
STRESS-0946,"Apparel Product 946",IT,Amazon,Apparel,9.18,18.99,15,5.11,12,3.9,85,TRUE,TRUE,546.91,540,266.62,226.73\r
STRESS-0947,"Pet Supplies Product 947",ES,WooCommerce,Pet Supplies,10.82,18.78,15,3.23,21,2.6,230,TRUE,TRUE,946.51,945,307.62,394.13\r
STRESS-0948,"Electronics Product 948",DE,Shopify,Electronics,24.45,46.57,13,4.11,21,5.6,196,TRUE,TRUE,2347.13,945,1642.99,744.28\r
STRESS-0949,"Home & Kitchen Product 949",FR,Amazon,Home & Kitchen,23.31,42.97,13,5.51,23,2.7,186,FALSE,FALSE,2371.94,1035,800.53,765.49\r
STRESS-0950,"Sports & Outdoors Product 950",IT,WooCommerce,Sports & Outdoors,10.87,22.4,14,3.78,2,6.8,357,TRUE,FALSE,107.52,90,91.39,41.88\r
STRESS-0951,"Beauty & Health Product 951",ES,Shopify,Beauty & Health,10.34,19.97,15,3.21,20,5.6,62,FALSE,TRUE,958.56,900,670.99,389.64\r
STRESS-0952,"Apparel Product 952",DE,Amazon,Apparel,37.83,86.86,14,39.09,20,5.4,270,TRUE,FALSE,4169.28,900,2814.26,1192.32\r
STRESS-0953,"Pet Supplies Product 953",FR,WooCommerce,Pet Supplies,13.01,24.75,14,3.23,12,2,349,TRUE,TRUE,712.8,540,178.2,268.2\r
STRESS-0954,"Electronics Product 954",IT,Shopify,Electronics,23.41,42.35,15,5.74,21,5.3,475,TRUE,TRUE,2134.44,945,1414.07,691.11\r
STRESS-0955,"Home & Kitchen Product 955",ES,Amazon,Home & Kitchen,33.19,74.9,14,3.92,8,2.1,392,FALSE,TRUE,1438.08,360,377.5,419.52\r
STRESS-0956,"Sports & Outdoors Product 956",DE,WooCommerce,Sports & Outdoors,29.81,60.17,13,5.39,13,5.7,115,TRUE,TRUE,1877.3,585,1337.58,566.83\r
STRESS-0957,"Beauty & Health Product 957",FR,Shopify,Beauty & Health,32.54,68.8,12,4.78,11,5.4,479,TRUE,FALSE,1816.32,495,1226.02,536.58\r
STRESS-0958,"Apparel Product 958",IT,Amazon,Apparel,9.26,20.2,15,3.67,14,2.1,332,TRUE,TRUE,678.72,630,178.16,274.68\r
STRESS-0959,"Pet Supplies Product 959",ES,WooCommerce,Pet Supplies,12.2,21.81,15,2.52,25,3.3,195,TRUE,TRUE,1308.6,1125,539.8,514.65\r
STRESS-0960,"Electronics Product 960",DE,Shopify,Electronics,12.74,34.67,15,5.71,11,3.3,116,TRUE,TRUE,7436.72,495,377.56,311.32\r
STRESS-0961,"Home & Kitchen Product 961",FR,Amazon,Home & Kitchen,12.55,21.24,13,5.91,6,5.4,490,TRUE,TRUE,305.86,270,206.45,121.46\r
STRESS-0962,"Sports & Outdoors Product 962",IT,WooCommerce,Sports & Outdoors,35.64,98.64,15,5.33,14,6.2,164,TRUE,FALSE,3314.3,630,2568.59,933.58\r
STRESS-0963,"Beauty & Health Product 963",ES,Shopify,Beauty & Health,35.3,64.86,13,5.44,25,2.6,411,TRUE,TRUE,3891.6,1125,1264.77,1160.4\r
STRESS-0964,"Apparel Product 964",DE,Amazon,Apparel,48.58,97.19,15,4.73,24,6.8,318,TRUE,TRUE,5598.14,1080,4758.42,1579.54\r
STRESS-0965,"Pet Supplies Product 965",FR,WooCommerce,Pet Supplies,29.28,73.03,14,3.94,20,5.6,116,FALSE,TRUE,3505.44,900,2453.81,1026.36\r
STRESS-0966,"Electronics Product 966",IT,Shopify,Electronics,31.56,69.95,14,3.74,3,2.2,344,FALSE,FALSE,503.64,135,138.5,148.41\r
STRESS-0967,"Home & Kitchen Product 967",ES,Amazon,Home & Kitchen,48.16,90.02,12,3.51,18,4.1,294,TRUE,TRUE,3888.86,810,1993.04,1107.22\r
STRESS-0968,"Sports & Outdoors Product 968",DE,WooCommerce,Sports & Outdoors,34.76,70.37,14,31.67,16,2.6,77,TRUE,TRUE,2702.21,720,878.22,795.55\r
STRESS-0969,"Beauty & Health Product 969",FR,Shopify,Beauty & Health,10.55,19.9,14,5.24,14,3.1,468,TRUE,TRUE,668.64,630,259.1,272.16\r
STRESS-0970,"Apparel Product 970",IT,Amazon,Apparel,32.89,78.35,12,3.37,18,5.9,335,TRUE,FALSE,3384.72,810,2496.23,981.18\r
STRESS-0971,"Pet Supplies Product 971",ES,WooCommerce,Pet Supplies,10.95,30.17,14,2.58,19,5.6,181,TRUE,FALSE,1375.75,855,963.03,486.44\r
STRESS-0972,"Electronics Product 972",DE,Shopify,Electronics,9.83,27.78,13,4.79,23,5.9,58,FALSE,FALSE,1533.46,1035,1130.92,555.86\r
STRESS-0973,"Home & Kitchen Product 973",FR,Amazon,Home & Kitchen,20.22,37.14,15,4.25,9,2.3,388,TRUE,TRUE,802.22,405,230.64,268.06\r
STRESS-0974,"Sports & Outdoors Product 974",IT,WooCommerce,Sports & Outdoors,17.06,33.1,13,2.88,7,6.6,177,FALSE,TRUE,556.08,315,458.77,191.52\r
STRESS-0975,"Beauty & Health Product 975",ES,Shopify,Beauty & Health,22.36,48.44,13,4.12,8,6.8,67,TRUE,TRUE,930.05,360,790.54,292.51\r
STRESS-0976,"Apparel Product 976",DE,Amazon,Apparel,101.85,94.31,14,4.47,19,6.9,105,TRUE,TRUE,4300.54,855,3709.21,1217.63\r
STRESS-0977,"Pet Supplies Product 977",FR,WooCommerce,Pet Supplies,48.68,91.09,13,3.94,12,6,204,TRUE,FALSE,2623.39,540,1967.54,745.85\r
STRESS-0978,"Electronics Product 978",IT,Shopify,Electronics,27.5,55.45,15,4.25,22,5.6,304,TRUE,FALSE,2927.76,990,2049.43,896.94\r
STRESS-0979,"Home & Kitchen Product 979",ES,Amazon,Home & Kitchen,40.73,94.67,15,5.93,16,3.8,108,FALSE,TRUE,3635.33,720,1726.78,1028.83\r
STRESS-0980,"Sports & Outdoors Product 980",DE,WooCommerce,Sports & Outdoors,39.89,80.23,13,4.23,16,2.2,79,TRUE,FALSE,3080.83,720,847.23,890.21\r
STRESS-0981,"Beauty & Health Product 981",FR,Shopify,Beauty & Health,28.62,60.66,13,4.83,20,6,413,TRUE,TRUE,2911.68,900,2183.76,877.92\r
STRESS-0982,"Apparel Product 982",IT,Amazon,Apparel,19.1,53.26,13,3.13,5,6.6,137,TRUE,TRUE,639.12,225,527.27,197.28\r
STRESS-0983,"Pet Supplies Product 983",ES,WooCommerce,Pet Supplies,14.87,26.45,14,3.28,23,2,323,FALSE,TRUE,1460.04,1035,365.01,537.51\r
STRESS-0984,"Electronics Product 984",DE,Shopify,Electronics,17.07,28.77,15,5.1,17,22.5,128,FALSE,FALSE,1173.82,765,3668.17,420.95\r
STRESS-0985,"Home & Kitchen Product 985",FR,Amazon,Home & Kitchen,11.77,28.22,13,2.73,8,5,465,TRUE,TRUE,541.82,360,338.64,195.46\r
STRESS-0986,"Sports & Outdoors Product 986",IT,WooCommerce,Sports & Outdoors,12.95,23.94,12,3.81,4,2,480,TRUE,TRUE,229.82,180,57.46,87.46\r
STRESS-0987,"Beauty & Health Product 987",ES,Shopify,Beauty & Health,27.61,62.28,12,2.87,24,5.5,435,TRUE,TRUE,3587.33,1080,2466.29,1076.83\r
STRESS-0988,"Apparel Product 988",DE,Amazon,Apparel,32.88,58.24,14,4.31,22,5.3,65,TRUE,FALSE,3075.07,990,2037.24,933.77\r
STRESS-0989,"Pet Supplies Product 989",FR,WooCommerce,Pet Supplies,24.11,50.62,12,4.53,24,4.6,256,TRUE,FALSE,2915.71,1080,1676.53,908.93\r
STRESS-0990,"Electronics Product 990",IT,Shopify,Electronics,42.7,72.26,12,5.13,17,2.7,485,TRUE,TRUE,2948.21,765,995.02,864.55\r
STRESS-0991,"Home & Kitchen Product 991",ES,Amazon,Home & Kitchen,44.4,80.64,14,3.59,6,3.1,56,TRUE,TRUE,1161.22,270,449.97,335.3\r
STRESS-0992,"Sports & Outdoors Product 992",DE,WooCommerce,Sports & Outdoors,9.86,25.91,13,5.26,5,3.6,380,FALSE,TRUE,2526.22,225,139.91,115.23\r
STRESS-0993,"Beauty & Health Product 993",FR,Shopify,Beauty & Health,8,17.3,14,2.65,9,4.6,269,FALSE,TRUE,373.68,405,214.87,160.92\r
STRESS-0994,"Apparel Product 994",IT,Amazon,Apparel,32.75,85.88,12,5.85,16,6.4,289,TRUE,TRUE,3297.79,720,2638.23,944.45\r
STRESS-0995,"Pet Supplies Product 995",ES,WooCommerce,Pet Supplies,23.62,40.09,13,3.77,22,2.7,371,TRUE,FALSE,2116.75,990,714.4,694.19\r
STRESS-0996,"Electronics Product 996",DE,Shopify,Electronics,43.12,72.2,12,5.07,1,6,289,FALSE,TRUE,173.28,45,129.96,50.82\r
STRESS-0997,"Home & Kitchen Product 997",FR,Amazon,Home & Kitchen,28.31,53.69,15,2.98,21,5.7,497,TRUE,TRUE,2705.98,945,1928.01,833.99\r
STRESS-0998,"Sports & Outdoors Product 998",IT,WooCommerce,Sports & Outdoors,25.74,52.82,13,5.5,10,2.7,324,TRUE,FALSE,1267.68,450,427.84,391.92\r
STRESS-0999,"Beauty & Health Product 999",ES,Shopify,Beauty & Health,28.16,76.77,12,4.68,22,4.8,97,TRUE,TRUE,4053.46,990,2432.07,1178.36\r
STRESS-1000,"Apparel Product 1000",DE,Amazon,Apparel,35,64.92,15,29.21,3,2.8,81,FALSE,TRUE,467.42,135,163.6,139.36\r
`;export{S as s};
