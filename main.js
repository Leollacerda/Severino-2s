var Botkit = require("botkit");
var request = require("request");
var _ = require("lodash");
var accessToken = process.env.ACCESS_TOKEN;
var regexEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
var data = new Date();
var botOuviu;
var globalID;
var localPedido;
var tipoPessoaPedido;
var qtdCafePedido = 0;
var qtdAguaPedido = 0;
var auxPedido = 0;
var auxContato = 0;
var auxContratoEoX = 0;
var frasePedido;
var menuContato;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

if (!accessToken) {
  console.log("Deu ruim na chave de acesso");
  process.exit(1);
}

if (!process.env.PUBLIC_URL) {
  console.log("Deu ruim na URL Publica");
  process.exit(1);
}

var controller = Botkit.sparkbot({
  log: true,
  public_address: process.env.PUBLIC_URL,
  access_token: accessToken,
  webhook_name: process.env.WEBHOOK_NAME,
  stats_optout: true
});

var bot = controller.spawn({});

controller.setupWebserver(process.env.PORT || 3000, function(err, webserver) {
  controller.createWebhookEndpoints(webserver, bot, function() {
    console.log("Webhook set up!");
  });
});

//verifica se o email é valido e confirma que recebeu com sucesso
controller.hears(["@"], "direct_message,direct_mention", function(
  bot,
  message
) {
  if (globalID == 1) {
    //email de quem digita
    var verificaUser = message.user;
    if (verificaUser.match(/@2s.com.br/) || verificaUser.match(/@webex.bot/)) {
      if (verificaUser.match(/@webex.bot/)) {
        //não faz nada
      } else {
        //email digitado
        var emailGuest = message.text;
        //senha a ser criada
        var senhaCriada;
        if (regexEmail.test(emailGuest)) {
          console.log(
            "### Chamando criaGuest com o parametro -> " + emailGuest
          );

          function gerarSenha() {
            return Math.random()
              .toString(36)
              .slice(-8);
          }
          senhaCriada = gerarSenha();

          //chama a função para criar o guest
          criaGuest(verificaUser, emailGuest, senhaCriada, function(code) {
            console.log("########## Code " + code);
            if (code == 201) {
              console.log(
                "Severino falou -> " +
                  "Prontinho...\n\nAgora é só acessar o SSID 2S_Guest e colocar os seguintes dados:\n\nUsuário: " +
                  emailGuest +
                  "\n\nSenha: " +
                  senhaCriada +
                  "\n\nBoa navegação!!\n\n*-- O acesso dura 1 dia --*"
              );
              bot.reply(
                message,
                "Prontinho...\n\nAgora é só acessar o SSID 2S_Guest e colocar os seguintes dados:\n\nUsuário: " +
                  emailGuest +
                  "\n\nSenha: " +
                  senhaCriada +
                  "\n\nBoa navegação!!\n\n*-- O acesso dura 1 dia --*"
              );
            } else {
              console.log(
                "Severino falou -> " +
                  "Xí, parece que alguma coisa deu errado no ISE."
              );
              bot.reply(
                message,
                "Xí, parece que alguma coisa deu errado no ISE."
              );
            }
          });
        } else {
          if (verificaUser.match(/@webex.bot/)) {
            //faz nada
          } else {
            console.log("Severino falou -> " + "E-mail inválido.");
            bot.reply(message, "E-mail inválido.");
          }
        }
      }
    } else {
      console.log(
        "Severino falou -> " +
          "Hey humano!\n\nVocê parece ser uma pessoa super legal, mas eu só estou autorizado a falar com o pessoal da 2S.\n\nDesculpe :/"
      );
      bot.reply(
        message,
        "Hey humano!\n\nVocê parece ser uma pessoa super legal, mas eu só estou autorizado a falar com o pessoal da 2S.\n\nDesculpe :/"
      );
    }
  } else {
    if (verificaUser.match(/@webex.bot/)) {
      //faz nada
    } else {
      console.log(
        "Severino falou -> " +
          "Parece que você não selecionou o que deseja no menu, por favor informe o número."
      );
      bot.reply(
        message,
        "Parece que você não selecionou o que deseja no menu, por favor informe o número."
      );
    }
  }
});

//comando para dar olá e mostrar o menu
controller.hears(
  ["Olá", "Opa", "Ola", "Oi", "Salve"],
  "direct_message,direct_mention",
  function(bot, message) {
    var verificaUser = message.user;
    if (verificaUser.match(/@2s.com.br/) || verificaUser.match(/@webex.bot/)) {
      if (verificaUser.match(/@webex.bot/)) {
        //não faz nada
      } else if (auxContato == 21) {
        var botOuviuLocal = message.text;
        console.log("*** Nome digitado pelo usuário: " + botOuviuLocal);
        consultarContato(botOuviuLocal, function(contatoRetornado) {
          console.log("Severino falou -> " + contatoRetornado);
          bot.reply(message, contatoRetornado);
        });
      } else if (auxContratoEoX == 32) {
        var botOuviuLocal = message.text;
        console.log("*** Part number digitado pelo usuário: " + botOuviuLocal);
        consultarEOX(botOuviuLocal, function(
          pnInfo,
          eoSaleInfo,
          eoSupInfo,
          linkInfo
        ) {
          if (eoSaleInfo.match(/Não há informações/)) {
            console.log("Severino falou -> " + eoSaleInfo);
            bot.reply(
              message,
              "* Part Number: " + pnInfo + "\n\n* " + eoSaleInfo
            );
          } else if (eoSaleInfo.match(/inválido/)) {
            console.log("Severino falou -> " + eoSaleInfo);
            bot.reply(message, eoSaleInfo);
          } else {
            console.log(
              "127 Severino falou -> " +
                "* Part Number: " +
                pnInfo +
                "\n\n* End-of-Sale: " +
                eoSaleInfo +
                "\n\n* End-of-Support:  " +
                eoSupInfo +
                "\n\n* Link Referência: " +
                linkInfo
            );
            bot.reply(
              message,
              "* Part Number: " +
                pnInfo +
                "\n\n* End-of-Sale: " +
                eoSaleInfo +
                "\n\n* End-of-Support:  " +
                eoSupInfo +
                "\n\n* Link Referência: " +
                linkInfo
            );
          }
        });
      } else if (auxContratoEoX == 33) {
        var botOuviuLocal = message.text;
        console.log(
          "*** Serial number digitado pelo usuário: " + botOuviuLocal
        );
        consultarInfoContrato(botOuviuLocal, function(
          serialInfo,
          pnInfo,
          descricaoInfo,
          coberturaInfo,
          dataFinalInfo
        ) {
          if (pnInfo.match(/Não há informações/)) {
            console.log(
              "Severino falou -> " + "* Serial Number: " + serialInfo + pnInfo
            );
            bot.reply(
              message,
              "* Serial Number: " + serialInfo + "\n\n* " + pnInfo
            );
          } else if (coberturaInfo.match(/Não/)) {
            console.log(
              "Severino falou -> " +
                "* Serial number: " +
                serialInfo +
                "\n\n* Part number: " +
                pnInfo +
                "\n\n* Descrição: " +
                descricaoInfo +
                "\n\n* Está coberto? " +
                coberturaInfo
            );
            bot.reply(
              message,
              "* Serial number: " +
                serialInfo +
                "\n\n* Part number: " +
                pnInfo +
                "\n\n* Descrição: " +
                descricaoInfo +
                "\n\n* Está coberto? " +
                coberturaInfo
            );
          } else {
            console.log(
              "Severino falou -> " +
                "* Serial number: " +
                serialInfo +
                "\n\n* Part number: " +
                pnInfo +
                "\n\n* Descrição: " +
                descricaoInfo +
                "\n\n* Está coberto? " +
                coberturaInfo +
                "\n\n* Último dia de cobertura: " +
                dataFinalInfo
            );
            bot.reply(
              message,
              "* Serial number: " +
                serialInfo +
                "\n\n* Part number: " +
                pnInfo +
                "\n\n* Descrição: " +
                descricaoInfo +
                "\n\n* Está coberto? " +
                coberturaInfo +
                "\n\n* Último dia de cobertura: " +
                dataFinalInfo
            );
          }
        });
      } else {
        auxContato = 0;
        auxPedido = 0;
        auxContratoEoX = 0;
        globalID = 0;
        console.log(
          "Severino falou -> " +
            "Oi humano!\n\nPor favor digite o número correspondente ao que deseja :)\n\n1 - Criar acesso Guest Wi-Fi\n\n2 - Pedir um café para seus convidados\n\n3 - Consultar a cotação do dólar\n\n4 - Mostrar o endereço da VPN 2S\n\n5 - Consultar contato da 2S ou Cisco\n\n6 - Verificar coberturas e EoX\n\n\n*-- Para ver o menu novamente, basta digitar 'menu' --*"
        );
        bot.reply(
          message,
          "Oi humano!\n\nPor favor digite o número correspondente ao que deseja :)\n\n1 - Criar acesso Guest Wi-Fi\n\n2 - Pedir um café para seus convidados\n\n3 - Consultar a cotação do dólar\n\n4 - Mostrar o endereço da VPN 2S\n\n5 - Consultar contato da 2S ou Cisco\n\n6 - Verificar coberturas e EoX\n\n\n*-- Para ver o menu novamente, basta digitar 'menu' --*"
        );
      }
    } else {
      console.log(
        "Severino falou -> " +
          "Hey humano!\n\nVocê parece ser uma pessoa super legal, mas eu só estou autorizado a falar com o pessoal da 2S.\n\nDesculpe :/"
      );
      bot.reply(
        message,
        "Hey humano!\n\nVocê parece ser uma pessoa super legal, mas eu só estou autorizado a falar com o pessoal da 2S.\n\nDesculpe :/"
      );
    }
  }
);

controller.hears(["Menu"], "direct_message,direct_mention", function(
  bot,
  message
) {
  var verificaUser = message.user;
  if (verificaUser.match(/@2s.com.br/) || verificaUser.match(/@webex.bot/)) {
    if (verificaUser.match(/@webex.bot/)) {
      //não faz nada
    } else {
      auxContato = 0;
      auxPedido = 0;
      auxContratoEoX = 0;
      globalID = 0;
      console.log(
        "Severino falou -> " +
          "Por favor digite o número correspondente ao que deseja :)\n\n1 - Criar acesso Guest Wi-Fi\n\n2 - Pedir um café para seus convidados\n\n3 - Consultar a cotação do dólar\n\n4 - Mostrar o endereço da VPN 2S\n\n5 - Consultar contato da 2S ou Cisco\n\n6 - Verificar coberturas e EoX"
      );
      bot.reply(
        message,
        "Por favor digite o número correspondente ao que deseja :)\n\n1 - Criar acesso Guest Wi-Fi\n\n2 - Pedir um café para seus convidados\n\n3 - Consultar a cotação do dólar\n\n4 - Mostrar o endereço da VPN 2S\n\n5 - Consultar contato da 2S ou Cisco\n\n6 - Verificar coberturas e EoX"
      );
    }
  } else {
    console.log(
      "Severino falou -> " +
        "Hey humano!\n\nVocê parece ser uma pessoa super legal, mas eu só estou autorizado a falar com o pessoal da 2S.\n\nDesculpe :/"
    );
    bot.reply(
      message,
      "Hey humano!\n\nVocê parece ser uma pessoa super legal, mas eu só estou autorizado a falar com o pessoal da 2S.\n\nDesculpe :/"
    );
  }
});

//pega o local da reunião e guarda na variável localPedido
controller.hears(
  ["sala", "lounge", "Reuniões"],
  "direct_message,direct_mention",
  function(bot, message) {
    var verificaUser = message.user;
    if (globalID == 2) {
      if (
        verificaUser.match(/@2s.com.br/) ||
        verificaUser.match(/@webex.bot/)
      ) {
        if (verificaUser.match(/@webex.bot/)) {
          //não faz nada
        } else {
          auxPedido = 11;
          localPedido = message.text;
          console.log(
            "Severino falou -> " +
              "É uma reunião interna ou com cliente? *Responda apenas 'interna' ou 'cliente' por favor.*"
          );
          bot.reply(
            message,
            "É uma reunião interna ou com cliente? *Responda apenas 'interna' ou 'cliente' por favor.*"
          );
        }
      } else {
        console.log(
          "Severino falou -> " +
            "Hey humano!\n\nVocê parece ser uma pessoa super legal, mas eu só estou autorizado a falar com o pessoal da 2S.\n\nDesculpe :/"
        );
        bot.reply(
          message,
          "Hey humano!\n\nVocê parece ser uma pessoa super legal, mas eu só estou autorizado a falar com o pessoal da 2S.\n\nDesculpe :/"
        );
      }
    } else {
      if (verificaUser.match(/@webex.bot/)) {
        //faz nada
      } else {
        console.log(
          "Severino falou -> " +
            "Parece que você não selecionou o que deseja no menu, por favor informe o número."
        );
        bot.reply(
          message,
          "Parece que você não selecionou o que deseja no menu, por favor informe o número."
        );
      }
    }
  }
);

//pega o tipo de convidado da reunião e guarda na variável tipoPessoaPedido
controller.hears(
  ["interna", "interno", "cliente"],
  "direct_message,direct_mention",
  function(bot, message) {
    var verificaUser = message.user;
    if (globalID == 2 && auxPedido == 11) {
      if (
        verificaUser.match(/@2s.com.br/) ||
        verificaUser.match(/@webex.bot/)
      ) {
        if (verificaUser.match(/@webex.bot/)) {
          //não faz nada
        } else {
          auxPedido = 12;
          tipoPessoaPedido = message.text;
          console.log(
            "Severino falou -> " +
              "Quantos cafés deseja? *Responda com um número ou com um bule, caso não precise, digite 0.*"
          );
          bot.reply(
            message,
            "Quantos cafés deseja? *Responda com um número ou com um bule, caso não precise, digite 0.*"
          );
        }
      } else {
        console.log(
          "Severino falou -> " +
            "Hey humano!\n\nVocê parece ser uma pessoa super legal, mas eu só estou autorizado a falar com o pessoal da 2S.\n\nDesculpe :/"
        );
        bot.reply(
          message,
          "Hey humano!\n\nVocê parece ser uma pessoa super legal, mas eu só estou autorizado a falar com o pessoal da 2S.\n\nDesculpe :/"
        );
      }
    } else {
      if (verificaUser.match(/@webex.bot/)) {
        //faz nada
      } else {
        console.log(
          "Severino falou -> " +
            "Parece que você não selecionou o que deseja no menu, por favor informe o número."
        );
        bot.reply(
          message,
          "Parece que você não selecionou o que deseja no menu, por favor informe o número."
        );
      }
    }
  }
);

// recebe não como resposta e informa que não pode ajudar
controller.hears(
  ["Não", "Agora não", "Nao"],
  "direct_message,direct_mention",
  function(bot, message) {
    var verificaUser = message.user;
    if (globalID == 1) {
      if (
        verificaUser.match(/@2s.com.br/) ||
        verificaUser.match(/@webex.bot/)
      ) {
        if (verificaUser.match(/@webex.bot/)) {
          //bot não faz nada mas reconhece que o não veio dele mesmo
        } else {
          console.log(
            "Severino falou -> " +
              "Poxa :(\n\nEntão a hora que quiser pode me chamar!"
          );
          bot.reply(
            message,
            "Poxa :(\n\nEntão a hora que quiser pode me chamar!"
          );
        }
      } else {
        console.log(
          "Severino falou -> " +
            "Hey humano!\n\nVocê parece ser uma pessoa super legal, mas eu só estou autorizado a falar com o pessoal da 2S.\n\nDesculpe :/"
        );
        bot.reply(
          message,
          "Hey humano!\n\nVocê parece ser uma pessoa super legal, mas eu só estou autorizado a falar com o pessoal da 2S.\n\nDesculpe :/"
        );
      }
    }
    if (globalID == 2) {
      if (
        verificaUser.match(/@2s.com.br/) ||
        verificaUser.match(/@webex.bot/)
      ) {
        if (verificaUser.match(/@webex.bot/)) {
          //faz nada
        } else {
          console.log(
            "Severino falou -> " +
              "Então vamos voltar e começar de novo, digite 'menu'."
          );
          bot.reply(
            message,
            "Então vamos voltar e começar de novo, digite 'menu'."
          );
        }
      } else {
        console.log(
          "Severino falou -> " +
            "Hey humano!\n\nVocê parece ser uma pessoa super legal, mas eu só estou autorizado a falar com o pessoal da 2S.\n\nDesculpe :/"
        );
        bot.reply(
          message,
          "Hey humano!\n\nVocê parece ser uma pessoa super legal, mas eu só estou autorizado a falar com o pessoal da 2S.\n\nDesculpe :/"
        );
      }
    } else {
      if (verificaUser.match(/@webex.bot/)) {
        // faz nada
      } else {
        console.log(
          "Severino falou -> " +
            "Parece que você não selecionou o que deseja no menu, por favor informe o número."
        );
        bot.reply(
          message,
          "Parece que você não selecionou o que deseja no menu, por favor informe o número."
        );
      }
    }
  }
);

// recebe sim como resposta
controller.hears(["Sim", "Confirmo"], "direct_message,direct_mention", function(
  bot,
  message
) {
  var verificaUser = message.user;
  if (globalID == 2) {
    if (verificaUser.match(/@2s.com.br/) || verificaUser.match(/@webex.bot/)) {
      if (verificaUser.match(/@webex.bot/)) {
        //faz nada
      } else {
        auxContato = 0;
        auxContratoEoX = 0;
        var options = {
          method: "POST",
          url: "https://api.ciscospark.com/v1/messages",
          headers: {
            Authorization:
              "Bearer YTFhZjcwMGEtOWY5Yi00ZTFmLWJiMTEtYmI5YWZjNWNkNDIxNzdlMmE2MzktZmQz",
            "Content-Type": "application/json"
          },
          body: {
            roomId:
              "Y2lzY29zcGFyazovL3VzL1JPT00vMjVjN2JlZDAtYTQ5NS0xMWU4LTk1M2MtZDVhMDQzODlmMWM0",
            text:
              "Chegou um pedido de café/água!\nSolicitante: " +
              verificaUser +
              "\nPedido:\n" +
              frasePedido
          },
          json: true
        };

        request(options, function(error, response, body) {
          if (error) {
            console.log("### Error Café -> " + error);
          } else {
            console.log("############ response -> " + response.statusCode);
          }
        });

        console.log(
          "Severino falou -> " +
            "Prontinho, seu pedido foi enviado para o espaço Cafezinho 2S!"
        );
        bot.reply(
          message,
          "Prontinho, seu pedido foi enviado para o espaço Cafezinho 2S!"
        );
        auxPedido = 0;
      }
    } else {
      console.log(
        "Severino falou -> " +
          "Hey humano!\n\nVocê parece ser uma pessoa super legal, mas eu só estou autorizado a falar com o pessoal da 2S.\n\nDesculpe :/"
      );
      bot.reply(
        message,
        "Hey humano!\n\nVocê parece ser uma pessoa super legal, mas eu só estou autorizado a falar com o pessoal da 2S.\n\nDesculpe :/"
      );
    }
  } else {
    if (verificaUser.match(/@webex.bot/)) {
      // faz nada
    } else {
      console.log(
        "Severino falou -> " +
          "Parece que você não selecionou o que deseja no menu, por favor informe o número."
      );
      bot.reply(
        message,
        "Parece que você não selecionou o que deseja no menu, por favor informe o número."
      );
    }
  }
});

// Responde a agradecimentos
controller.hears(
  ["Obrigada", "Obrigado", "Valeu", "Thanks", "Grato"],
  "direct_message,direct_mention",
  function(bot, message) {
    var verificaUser = message.user;
    if (verificaUser.match(/@2s.com.br/) || verificaUser.match(/@webex.bot/)) {
      globalID = 0;
      auxContato = 0;
      auxContratoEoX = 0;
      auxPedido = 0;
      console.log("Severino falou -> " + "Estou aqui para ajudar :)");
      bot.reply(message, "Estou aqui para ajudar :)");
    } else {
      console.log(
        "Severino falou -> " +
          "Hey humano!\n\nVocê parece ser uma pessoa super legal, mas eu só estou autorizado a falar com o pessoal da 2S.\n\nDesculpe :/"
      );
      bot.reply(
        message,
        "Hey humano!\n\nVocê parece ser uma pessoa super legal, mas eu só estou autorizado a falar com o pessoal da 2S.\n\nDesculpe :/"
      );
    }
  }
);

//Cria o guest com o e-mail que recebeu no teams
function criaGuest(pessoaVisitada, userEmail, userSenha, callback) {
  var diaAMais = new Date();
  diaAMais.setDate(diaAMais.getDate() + 1);

  var strfromDate =
    data.getMonth() +
    1 +
    "/" +
    data.getDate() +
    "/" +
    data.getFullYear() +
    " " +
    data.getHours() +
    ":" +
    data.getMinutes();
  var strtoDate =
    data.getMonth() +
    1 +
    "/" +
    (data.getDate() + 1) +
    "/" +
    data.getFullYear() +
    " 23:00";
  //var strtoDate = (diaAMais.getMonth() + 1) + '/' + (diaAMais.getDate()) + '/' + diaAMais.getFullYear() + ' ' + '23' + ':' + '00';

  var options = {
    method: "POST",
    url: "https://10.3.161.171:9060/ers/config/guestuser",
    headers: {
      Authorization: "Basic c3BvbnNvci1hcGk6dkcxNg==",
      "ERS-Media-Type": "identity.guestuser.2.0",
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: {
      GuestUser: {
        name: "guest",
        guestType: "Guest Type (Wireless Setup - Beta)",
        status: "ACTIVE",
        sponsorUserName: "sponsor-api",
        guestInfo: {
          userName: userEmail,
          firstName: "",
          lastName: "",
          emailAddress: userEmail,
          password: userSenha,
          creationTime: "",
          enabled: true,
          notificationLanguage: "English",
          smsServiceProvider: "Global Default"
        },
        guestAccessInfo: {
          validDays: 2,
          fromDate: strfromDate,
          toDate: strtoDate,
          location: "San Jose"
        },
        personBeingVisited: pessoaVisitada,
        portalId: "bcd76bc2-8a3e-11e8-84e7-005056a65ea2",
        customFields: {}
      }
    },
    json: true
  };

  request(options, function(error, response, body) {
    if (response.statusCode >= 400) {
      console.log("### Error Create -> " + error);
    }
    callback(response.statusCode);
  });
}

//faz o GET na API da moeda
function pegarDolar(callback) {
  if (globalID == 3) {
    var dolar;
    var options = {
      method: "GET",
      url: "http://economia.awesomeapi.com.br/json/USD-BRL/1"
    };

    request(options, function(error, response, body) {
      body = JSON.parse(body);
      console.log("###### Body Moeda -> " + JSON.stringify(body));

      if (error) {
        console.log("### Error API Dólar -> " + error);
      } else {
        dolar = body[0].ask;
        callback(dolar);
      }
    });
  }
}

//traz informações sobre o contato escolhido da 2S
function consultarContato2S(nomeRecebido, callback) {
  if (globalID == 5 && menuContato == 1) {
    var XLSX = require("xlsx");
    var workbook = XLSX.readFile(
      "/home/administrator/Documents/Contatos/Contatos2SCisco.xlsx"
    );
    var sheet_name_list = workbook.SheetNames;
    var listaCompleta2S = XLSX.utils.sheet_to_json(
      workbook.Sheets[sheet_name_list[0]]
    );
    var resposta = "";

    auxContato = 0;
    auxPedido = 0;

    console.log("######### Nome que vai ser filtrado -> " + nomeRecebido);

    var itemfiltrado = _.filter(listaCompleta2S, function(item) {
      var nomeItemFormatted = item.Nome.toUpperCase();
      var nomeRecebidoFormatted = nomeRecebido.toUpperCase();

      if (nomeItemFormatted.indexOf(nomeRecebidoFormatted) > -1) {
        return item;
      }
    });

    if (itemfiltrado.length > 0) {
      _.forEach(itemfiltrado, function(item) {
        resposta +=
          "- Nome: " +
          item.Nome +
          " - E-mail: " +
          item.email +
          " - Ramal: " +
          item.Ramal +
          " - Celular: " +
          item.Celular +
          " \n\n";
      });
    } else {
      resposta =
        "Não encontrei nenhum registro desse nome :(\n\nDigite 'menu' para começar de novo.";
    }
    callback(resposta);
  }
}

//traz informações sobre o contato escolhido da Cisco
function consultarContatoCisco(nomeRecebido, callback) {
  if (globalID == 5 && menuContato == 2) {
    var XLSX = require("xlsx");
    var workbook = XLSX.readFile(
      "/home/administrator/Documents/Contatos/Contatos2SCisco.xlsx"
    );
    var sheet_name_list = workbook.SheetNames;
    var listaCompleta2S = XLSX.utils.sheet_to_json(
      workbook.Sheets[sheet_name_list[1]]
    );
    var resposta = "";

    auxContato = 0;
    auxPedido = 0;

    console.log("######### Nome que vai ser filtrado -> " + nomeRecebido);

    var itemfiltrado = _.filter(listaCompleta2S, function(item) {
      var nomeItemFormatted = item.Nome.toUpperCase();
      var nomeRecebidoFormatted = nomeRecebido.toUpperCase();

      if (nomeItemFormatted.indexOf(nomeRecebidoFormatted) > -1) {
        return item;
      }
    });

    if (itemfiltrado.length > 0) {
      _.forEach(itemfiltrado, function(item) {
        resposta +=
          "- Nome: " +
          item.Nome +
          " - E-mail: " +
          item.email +
          " - Ramal: " +
          item.Ramal +
          " - Celular: " +
          item.Celular +
          " \n\n";
      });
    } else {
      resposta =
        "Não encontrei nenhum registro desse nome :(\n\nDigite 'menu' para começar de novo.";
    }
    callback(resposta);
  }
}

//gera o token para as chamadas da API Cisco
function geraToken(callback) {
  if (globalID == 6) {
    auxContato = 0;
    auxPedido = 0;
    var token = " ";
    var options = {
      method: "POST",
      url: "https://cloudsso.cisco.com/as/token.oauth2 ",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Charset": "UTF-8"
      },
      form: {
        grant_type: "client_credentials",
        client_secret: "MaunFXsjMVrnPFCsT2QrZFHw",
        client_id: "6ycg4qccm7tstfj4xqfd2j2s"
      }
    };

    request(options, function(error, response, body) {
      body = JSON.parse(body);
      if (error) {
        console.log("###### Error API Token -> " + error);
      } else {
        token = body.access_token;
        callback(token);
      }
    });
  }
}

//consulta sobre o end of sale e support dos equipamentos
function consultarEOX(pnRecebido, callback) {
  if (globalID == 6) {
    var tokenGerado = geraToken(function(tokenGerado) {
      auxContato = 0;
      auxPedido = 0;
      auxContratoEoX = 0;
      var dataEoSale;
      var dataEoSupport;
      var linkRetornado;
      var pnRetornado;
      var eoSaleRetornado;
      var eoSupRetornado;
      var options = {
        method: "GET",
        url:
          "https://api.cisco.com/supporttools/eox/rest/5/EOXByProductID/" +
          pnRecebido,
        headers: {
          Authorization: "Bearer " + tokenGerado,
          "Content-Type": "application/json"
        },
        json: true
      };

      if (pnRecebido.length < 3) {
        eoSaleRetornado = "Part number inválido.";
        callback(eoSaleRetornado);
      } else {
        request(options, function(error, response, body) {
          if (error) {
            console.log("###### Error API EOSale -> " + error);
          } else {
            var listItem = [];
            if (body.EOXRecord != undefined && body.EOXRecord != null) {
              _.forEach(body.EOXRecord, function(item) {
                var itemToAdd = {};
                itemToAdd.productID = item.EOXInputValue;
                itemToAdd.eosDate = item.EndOfSaleDate.value;
                itemToAdd.ldSup = item.LastDateOfSupport.value;
                itemToAdd.linkProduct = item.LinkToProductBulletinURL;
                listItem.push(itemToAdd);
              });
            }
            console.log("listitem ########### " + JSON.stringify(listItem));

            listItem.forEach(function(element) {
              pnRetornado = element.productID;
              dataEoSale = element.eosDate;
              dataEoSupport = element.ldSup;
              linkRetornado = element.linkProduct;

              if (dataEoSale == "") {
                eoSaleRetornado = "Não há informações de End-of-Sale";
              } else {
                var parteSale = dataEoSale.split("-");
                eoSaleRetornado =
                  parteSale[2] + "/" + parteSale[1] + "/" + parteSale[0];

                var parteSup = dataEoSupport.split("-");
                eoSupRetornado =
                  parteSup[2] + "/" + parteSup[1] + "/" + parteSup[0];
              }
              callback(
                pnRetornado,
                eoSaleRetornado,
                eoSupRetornado,
                linkRetornado
              );
            });
          }
        });
      }
    });
  }
}

//devolve as informações sobre o serial informado e sobre o contrato de suporte
function consultarInfoContrato(serialRecebido, callback) {
  if (globalID == 6) {
    var tokenGerado = geraToken(function(tokenGerado) {
      auxContato = 0;
      auxPedido = 0;
      auxContratoEoX = 0;
      var serialRetornado;
      var pnRetornado;
      var descricaoRetornado;
      var statusRetornado;
      var dataFinalRetornada;
      var options = {
        method: "GET",
        url:
          "https://api.cisco.com/product/v1.0/coverage/summary/serial_numbers/" +
          serialRecebido,
        headers: {
          Authorization: "Bearer " + tokenGerado,
          "Content-Type": "application/json"
        },
        json: true
      };
      request(options, function(error, response, body) {
        if (error) {
          console.log("###### Error API EOSale -> " + error);
        } else {
          var listItem = [];
          if (body.serial_numbers != undefined && body.serial_numbers != null) {
            _.forEach(body.serial_numbers, function(item) {
              var itemToAdd = {};
              itemToAdd.srNo = item.sr_no;
              itemToAdd.orderablePid = item.orderable_pid_list[0].orderable_pid;
              itemToAdd.itemDescription =
                item.orderable_pid_list[0].item_description;
              itemToAdd.isCovered = item.is_covered;
              itemToAdd.coverageEndDate = item.coverage_end_date;
              listItem.push(itemToAdd);
            });
          }
          console.log("listitem " + JSON.stringify(listItem));

          //listItem = JSON.parse(JSON.stringify(listItem));
          listItem.forEach(function(element) {
            serialRetornado = element.srNo;
            pnRetornado = element.orderablePid;
            descricaoRetornado = element.itemDescription;
            statusRetornado = element.isCovered;
            var dataFinal = element.coverageEndDate;

            console.log("pnretornado -> " + pnRetornado);

            var parteDataFinal = dataFinal.split("-");
            dataFinalRetornada =
              parteDataFinal[2] +
              "/" +
              parteDataFinal[1] +
              "/" +
              parteDataFinal[0];

            if (pnRetornado == "") {
              pnRetornado = "Não há informações sobre o serial informado";
            } else if (statusRetornado == "YES") {
              statusRetornado = "Sim";
            } else if (statusRetornado == "NO") {
              statusRetornado = "Não";
            }

            callback(
              serialRetornado,
              pnRetornado,
              descricaoRetornado,
              statusRetornado,
              dataFinalRetornada
            );
          });
        }
      });
    });
  }
}

//easter egg 1
controller.hears(["Trouxa"], "direct_message,direct_mention", function(
  bot,
  message
) {
  var verificaUser = message.user;
  if (verificaUser.match(/@2s.com.br/)) {
    console.log("Severino falou -> " + "Você que é");
    bot.reply(message, "Você que é");
  } else {
    console.log(
      "Severino falou -> " +
        "Hey humano!\n\nVocê parece ser uma pessoa super legal, mas eu só estou autorizado a falar com o pessoal da 2S.\n\nDesculpe :/"
    );
    bot.reply(
      message,
      "Hey humano!\n\nVocê parece ser uma pessoa super legal, mas eu só estou autorizado a falar com o pessoal da 2S.\n\nDesculpe :/"
    );
  }
});

//easter egg 2
controller.hears(["Inovações"], "direct_message,direct_mention", function(
  bot,
  message
) {
  var verificaUser = message.user;
  if (verificaUser.match(/@2s.com.br/)) {
    console.log(
      "Severino falou -> " +
        "É a empresa onde eu trabalho :D\n\nFocada em tecnologia Cisco, fundada em 1992 e que em 2017 comemorou 25 anos!!\n\nPedrão, não esquece meu salário!\n\nVoto Carneiro para presidente o/"
    );
    bot.reply(
      message,
      "É a empresa onde eu trabalho :D\n\nFocada em tecnologia Cisco, fundada em 1992 e que em 2017 comemorou 25 anos!!\n\nPedrão, não esquece meu salário!\n\nVoto Carneiro para presidente o/"
    );
  } else {
    console.log(
      "Severino falou -> " +
        "Hey humano!\n\nVocê parece ser uma pessoa super legal, mas eu só estou autorizado a falar com o pessoal da 2S.\n\nDesculpe :/"
    );
    bot.reply(
      message,
      "Hey humano!\n\nVocê parece ser uma pessoa super legal, mas eu só estou autorizado a falar com o pessoal da 2S.\n\nDesculpe :/"
    );
  }
});

//easter egg 3
controller.hears(["Quem é sua mãe?"], "direct_message,direct_mention", function(
  bot,
  message
) {
  console.log("Severino falou -> " + "Minha criadora se chama Bruna Toledo ;)");
  bot.reply(message, "Minha criadora se chama Bruna Toledo ;)");
});

//easter egg 4
controller.hears(["Severino"], "direct_message,direct_mention", function(
  bot,
  message
) {
  console.log("Severino falou -> " + "Tò aquiiiii");
  bot.reply(message, "Tò aquiiiii");
});

//easter egg 5
controller.hears(["Marcelão"], "direct_message,direct_mention", function(
  bot,
  message
) {
  console.log("Severino falou -> " + "Isso é uma bichoooooooooona");
  bot.reply(message, "Isso é uma bichoooooooooona");
});

//cases do menu
controller.hears([".*"], "direct_message,direct_mention", function(
  bot,
  message
) {
  botOuviu = message.text;

  var verificaUser = message.user;
  if (verificaUser.match(/@2s.com.br/) || verificaUser.match(/@webex.bot/)) {
    if (verificaUser.match(/@webex.bot/)) {
      //faz nada
    } else {
      if (auxPedido > 0) {
        switch (auxPedido) {
          //cases do questionário do café/água
          case (auxPedido = 12):
            qtdCafePedido = message.text;
            auxPedido = 13;
            console.log(
              "Severino falou -> " +
                "Quantas águas deseja? *Responda com um número ou com uma jarra, caso não precise, digite 0.*"
            );
            bot.reply(
              message,
              "Quantas águas deseja? *Responda com um número ou com uma jarra, caso não precise, digite 0.*"
            );
            break;

          case (auxPedido = 13):
            qtdAguaPedido = message.text;
            frasePedido =
              "      - Local: " +
              localPedido +
              "\n      - Tipo de reunião: " +
              tipoPessoaPedido +
              "\n      - Cafés: " +
              qtdCafePedido +
              "\n      - Águas: " +
              qtdAguaPedido;
            console.log(
              "Severino falou -> " +
                "Revise seu pedido:\n\n- Local: " +
                localPedido +
                "\n- Tipo de reunião: " +
                tipoPessoaPedido +
                "\n- Cafés: " +
                qtdCafePedido +
                "\n- Águas: " +
                qtdAguaPedido +
                "\n\nVocê confirma o pedido? *[Sim/Não]*"
            );
            bot.reply(
              message,
              "Revise seu pedido:\n\n- Local: " +
                localPedido +
                "\n- Tipo de reunião: " +
                tipoPessoaPedido +
                "\n- Cafés: " +
                qtdCafePedido +
                "\n- Águas: " +
                qtdAguaPedido +
                "\n\nVocê confirma o pedido? *[Sim/Não]*"
            );
            break;
        }
      } else if (auxContato > 0) {
        switch (auxContato) {
          //cases do contato
          case (auxContato = 21):
            auxContato = 22;
            menuContato = message.text;
            console.log(
              "Severino falou -> " +
                "Por favor me informe o nome do contato que deseja buscar informações. **Não precisa colocar acentos**"
            );
            bot.reply(
              message,
              "Por favor me informe o nome do contato que deseja buscar informações. **Não precisa colocar acentos**"
            );
            break;

          case (auxContato = 22):
            if (menuContato == "1") {
              console.log("*** Nome digitado pelo usuário: " + botOuviu);
              consultarContato2S(botOuviu, function(contatoRetornado) {
                console.log("Severino falou -> " + contatoRetornado);
                bot.reply(message, contatoRetornado);
              });
            } else if (menuContato == "2") {
              console.log("*** Nome digitado pelo usuário: " + botOuviu);
              consultarContatoCisco(botOuviu, function(contatoRetornado) {
                console.log("Severino falou -> " + contatoRetornado);
                bot.reply(message, contatoRetornado);
              });
            }
            break;
        }
      } else if (auxContratoEoX > 0) {
        if (auxContratoEoX != 31) {
          switch (auxContratoEoX) {
            //cases para as ações do contrato e eox
            case (auxContratoEoX = 32):
              console.log("*** Part number digitado pelo usuário: " + botOuviu);
              consultarEOX(botOuviu, function(
                pnInfo,
                eoSaleInfo,
                eoSupInfo,
                linkInfo
              ) {
                console.log(
                  "Resultados callback -> " +
                    pnInfo +
                    " " +
                    eoSaleInfo +
                    " " +
                    eoSupInfo +
                    " " +
                    linkInfo
                );
                if (eoSaleInfo.match(/Não há informações/)) {
                  console.log("Severino falou -> " + eoSaleInfo);
                  bot.reply(
                    message,
                    "* Part Number: " + pnInfo + "\n\n* " + eoSaleInfo
                  );
                } else if (eoSaleInfo.match(/inválido/)) {
                  console.log("Severino falou -> " + eoSaleInfo);
                  bot.reply(message, eoSaleInfo);
                } else {
                  console.log(
                    "Severino falou -> " +
                      "* Part Number: " +
                      pnInfo +
                      "\n\n* End-of-Sale: " +
                      eoSaleInfo +
                      "\n\n* End-of-Support:  " +
                      eoSupInfo +
                      "\n\n* Link Referência: " +
                      linkInfo
                  );
                  bot.reply(
                    message,
                    "* Part Number: " +
                      pnInfo +
                      "\n\n* End-of-Sale: " +
                      eoSaleInfo +
                      "\n\n* End-of-Support:  " +
                      eoSupInfo +
                      "\n\n* Link Referência: " +
                      linkInfo
                  );
                }
              });
              break;

            case (auxContratoEoX = 33):
              console.log(
                "*** Serial number digitado pelo usuário: " + botOuviu
              );
              consultarInfoContrato(botOuviu, function(
                serialInfo,
                pnInfo,
                descricaoInfo,
                coberturaInfo,
                dataFinalInfo
              ) {
                if (pnInfo.match(/Não há informações/)) {
                  console.log(
                    "Severino falou -> " +
                      "* Serial Number: " +
                      serialInfo +
                      pnInfo
                  );
                  bot.reply(
                    message,
                    "* Serial Number: " + serialInfo + "\n\n* " + pnInfo
                  );
                } else if (coberturaInfo.match(/Não/)) {
                  console.log(
                    "Severino falou -> " +
                      "* Serial number: " +
                      serialInfo +
                      "\n\n* Part number: " +
                      pnInfo +
                      "\n\n* Descrição: " +
                      descricaoInfo +
                      "\n\n* Está coberto? " +
                      coberturaInfo
                  );
                  bot.reply(
                    message,
                    "* Serial number: " +
                      serialInfo +
                      "\n\n* Part number: " +
                      pnInfo +
                      "\n\n* Descrição: " +
                      descricaoInfo +
                      "\n\n* Está coberto? " +
                      coberturaInfo
                  );
                } else {
                  console.log(
                    "Severino falou -> " +
                      "* Serial number: " +
                      serialInfo +
                      "\n\n* Part number: " +
                      pnInfo +
                      "\n\n* Descrição: " +
                      descricaoInfo +
                      "\n\n* Está coberto? " +
                      coberturaInfo +
                      "\n\n* Último dia de cobertura: " +
                      dataFinalInfo
                  );
                  bot.reply(
                    message,
                    "* Serial number: " +
                      serialInfo +
                      "\n\n* Part number: " +
                      pnInfo +
                      "\n\n* Descrição: " +
                      descricaoInfo +
                      "\n\n* Está coberto? " +
                      coberturaInfo +
                      "\n\n* Último dia de cobertura: " +
                      dataFinalInfo
                  );
                }
              });
              break;
          }
        } else {
          switch (botOuviu) {
            //cases do menu do contrato e eox
            case "1":
              console.log("########## ouvi 1 -> End-of-Sale e End-of-Support");
              auxContratoEoX = 32;
              console.log(
                "Severino falou -> " +
                  "Por favor informe o part number completo do equipamento."
              );
              bot.reply(
                message,
                "Por favor informe o **part number completo** do equipamento, para pesquisar vários pns de uma vez, separe-os por vírgulas sem deixar espaços. Ex. ATA190,WS-C2960-24PC-L"
              );
              break;

            case "2":
              console.log(
                "########## ouvi 2 -> Informações e cobertura via serial number"
              );
              auxContratoEoX = 33;
              console.log(
                "Severino falou -> " +
                  "Por favor informe o serial number do equipamento."
              );
              bot.reply(
                message,
                "Por favor informe o **serial number** do equipamento, para pesquisar vários seriais de uma vez, separe-os por vírgulas sem deixar espaços. Ex. FCH2226VA2J,FXS1643Q25Q"
              );
              break;
          }
        }
      } else {
        switch (botOuviu) {
          //cases do menu principal
          case "1":
            console.log("########## ouvi 1 -> Criar Guest");
            globalID = 1;
            console.log(
              "Severino falou -> " +
                "Por favor digite apenas o e-mail do convidado."
            );
            bot.reply(
              message,
              "Por favor digite apenas o **e-mail** do convidado."
            );
            break;

          case "2":
            console.log("########## ouvi 2 -> Pedir Café");
            globalID = 2;
            console.log(
              "Severino falou -> " +
                "Entendido, por favor responda o questionário a seguir: \n\nOnde você está? *Exemplo: sala do Carneiro, sala de reuniões, lounge...*"
            );
            bot.reply(
              message,
              "Entendido, por favor responda o questionário a seguir: \n\nOnde você está? *Exemplo: sala do Carneiro, sala de reuniões, lounge...*"
            );
            break;

          case "3":
            console.log("########## ouvi 3 -> Cotação Dólar");
            globalID = 3;
            pegarDolar(function(valorDolar) {
              console.log(
                "Severino falou -> " +
                  "O valor do dólar comercial nesse momento é de R$ " +
                  Math.round(valorDolar * 100) / 100
              );
              bot.reply(
                message,
                "O valor do dólar comercial nesse momento é de R$ " +
                  Math.round(valorDolar * 100) / 100
              ) + ".";
              bot.reply(
                message,
                "*Essa cotação é informativa. Para uso em propostas comerciais e assuntos oficiais da 2S entre em contato com nosso time financeiro.*"
              );
            });
            break;

          case "4":
            console.log("########## ouvi 4 -> Endereço VPN");
            globalID = 4;
            console.log(
              "Severino falou -> " + "O endereço é: *vpn.2s.com.br:8443*."
            );
            bot.reply(message, "O endereço é: *vpn.2s.com.br:8443*. ");
            break;

          case "5":
            console.log("########## ouvi 5 -> Lista de contatos");
            auxContato = 21;
            globalID = 5;
            console.log(
              "Severino falou -> " +
                "Digite o número da opção desejada: " +
                "\n\n1 - Contato 2S \n\n2 - Contato Cisco"
            );
            bot.reply(
              message,
              "Digite o número da opção desejada: " +
                "\n\n1 - Contato 2S \n\n2 - Contato Cisco"
            );
            break;

          case "6":
            console.log("########## ouvi 6 -> Consultar coberturas e EoX");
            auxContratoEoX = 31;
            globalID = 6;
            console.log(
              "Severino falou -> " +
                "Escolha o número correspondente ao que deseja verificar: \n\n1 - End-of-Sale e End-of-Support\n\n2 - Informações e cobertura via serial number"
            );
            bot.reply(
              message,
              "Escolha o número correspondente ao que deseja verificar: \n\n1 - End-of-Sale e End-of-Support\n\n2 - Informações e cobertura via serial number"
            );
            break;
        }
      }
    }
  } else {
    console.log(
      "Severino falou -> " +
        "Hey humano!\n\nVocê parece ser uma pessoa super legal, mas eu só estou autorizado a falar com o pessoal da 2S.\n\nDesculpe :/"
    );
    bot.reply(
      message,
      "Hey humano!\n\nVocê parece ser uma pessoa super legal, mas eu só estou autorizado a falar com o pessoal da 2S.\n\nDesculpe :/"
    );
  }
});

//ACCESS_TOKEN=YmM4MWZkOWItYjRjZC00NDM4LWEyNjAtMjU2M2RhMmM3ZTI3ZGExYWRmZmEtZGUy_PF84_a892a6ed-b823-46b8-8336-847d8f4722ae PUBLIC_URL=https://bb35e463.ngrok.io node main.js
