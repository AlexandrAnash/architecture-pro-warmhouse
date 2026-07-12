package broker

import (
	"context"
	"encoding/json"
	"log"

	amqp "github.com/rabbitmq/amqp091-go"
)

type Publisher struct {
	ch *amqp.Channel
}

func NewPublisher(url string) (*Publisher, error) {
	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, err
	}
	ch, err := conn.Channel()
	if err != nil {
		return nil, err
	}
	if err := ch.ExchangeDeclare("smarthome", "topic", true, false, false, false, nil); err != nil {
		return nil, err
	}
	return &Publisher{ch: ch}, nil
}

func (p *Publisher) Publish(routingKey string, payload any) {
	if p == nil || p.ch == nil {
		return
	} // best-effort: молча выходим
	body, _ := json.Marshal(payload)
	if err := p.ch.PublishWithContext(context.Background(), "smarthome", routingKey, false, false, amqp.Publishing{
		ContentType: "application/json", Body: body,
	}); err != nil {
		log.Printf("publish failed: %v", err) // логируем, не роняем
	}
}
